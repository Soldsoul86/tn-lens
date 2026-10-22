"""TN Lens v0.1 — local-first, public-source research service.

A small FastAPI/SQLite backend. No login or transport encryption is provided:
run on localhost only until an authentication/authorization layer is added.
"""
from __future__ import annotations

import csv
import io
import json
import os
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit

from fastapi import FastAPI, HTTPException, Response
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent.parent
SEED = ROOT / "data" / "seed.json"
DEFAULT_DB = ROOT / "instance" / "tn_lens.sqlite3"

STATUS = {"open_question", "needs_verification", "in_review", "corroborated", "disputed", "resolved"}
SOURCE_TYPES = {"government", "organisation", "reporting", "research", "court", "other"}
STANCES = {"claim", "supports", "contrasts", "context", "outcome"}
PLATFORM_HOSTS = {
    "X": {"x.com", "twitter.com"},
    "Instagram": {"instagram.com"},
    "YouTube": {"youtube.com", "youtu.be"},
    "Facebook": {"facebook.com", "fb.com"},
    "LinkedIn": {"linkedin.com"},
    "Threads": {"threads.net"},
}

def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def valid_url(value: str) -> bool:
    """Enforce scheme/host shape; no URL fetch is performed by the API."""
    if not isinstance(value, str) or len(value) > 2048:
        return False
    try:
        parts = urlsplit(value)
        return parts.scheme == "https" and bool(parts.hostname) and parts.username is None and parts.password is None
    except ValueError:
        return False


def host(value: str) -> str:
    return (urlsplit(value).hostname or "").removeprefix("www.").lower()


def valid_date(value: str) -> bool:
    try:
        date.fromisoformat(value)
        return bool(value and len(value) == 10)
    except (ValueError, TypeError):
        return False


class NewIssue(BaseModel):
    title: str = Field(min_length=5, max_length=140)
    category: str = Field(min_length=3, max_length=80)
    district: str = "Statewide"
    summary: str = Field(min_length=20, max_length=3000)
    next_step: str = Field(min_length=10, max_length=1500)


class NewEvidence(BaseModel):
    source_label: str = Field(min_length=3, max_length=160)
    source_url: str = Field(min_length=10, max_length=2048)
    source_type: str = "other"
    published_on: str
    finding: str = Field(min_length=12, max_length=1800)
    stance: str = "context"


class Review(BaseModel):
    status: str
    note: str = Field(min_length=12, max_length=1800)
    reviewer: str = Field(default="Research reviewer", min_length=2, max_length=100)


class CsvImport(BaseModel):
    csv_text: str = Field(min_length=1, max_length=600000)


@contextmanager
def connect(db_path: Path):
    conn = sqlite3.connect(db_path, timeout=20)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def migrate_and_seed(db_path: Path, seed: dict):
    db_path.parent.mkdir(parents=True, exist_ok=True)
    with connect(db_path) as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS issues (
          id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL,
          district TEXT NOT NULL, summary TEXT NOT NULL, status TEXT NOT NULL,
          opened_on TEXT NOT NULL, next_step TEXT NOT NULL, created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS evidence (
          id TEXT PRIMARY KEY, issue_id TEXT NOT NULL REFERENCES issues(id),
          source_label TEXT NOT NULL, source_url TEXT NOT NULL,
          source_type TEXT NOT NULL, published_on TEXT NOT NULL,
          finding TEXT NOT NULL, stance TEXT NOT NULL, added_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS audit (
          id TEXT PRIMARY KEY, issue_id TEXT NOT NULL REFERENCES issues(id),
          event TEXT NOT NULL, previous_status TEXT, new_status TEXT,
          note TEXT NOT NULL, reviewer TEXT NOT NULL, at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS social_posts (
          id TEXT PRIMARY KEY, platform TEXT NOT NULL, published_on TEXT NOT NULL,
          topic TEXT NOT NULL, post_url TEXT NOT NULL UNIQUE, views INTEGER,
          likes INTEGER NOT NULL, comments INTEGER NOT NULL, shares INTEGER NOT NULL,
          imported_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS indicators (
          id TEXT PRIMARY KEY, district TEXT NOT NULL, indicator TEXT NOT NULL,
          year INTEGER NOT NULL, value REAL NOT NULL, unit TEXT NOT NULL,
          source_label TEXT NOT NULL, source_url TEXT NOT NULL,
          verification TEXT NOT NULL, imported_at TEXT NOT NULL,
          UNIQUE(district, indicator, year, source_url)
        );
        CREATE INDEX IF NOT EXISTS idx_evidence_issue ON evidence(issue_id);
        CREATE INDEX IF NOT EXISTS idx_social_topic ON social_posts(topic);
        CREATE INDEX IF NOT EXISTS idx_indicator_dist ON indicators(district);
        """)
        for issue in seed["issues"]:
            db.execute("""INSERT OR IGNORE INTO issues VALUES (?,?,?,?,?,?,?,?,?,?)""", (
                issue["id"], issue["title"], issue["category"], issue["district"],
                issue["summary"], issue["status"], issue["opened_on"],
                issue["next_step"], seed["metadata"]["snapshot_as_of"] + "T00:00:00Z",
                seed["metadata"]["snapshot_as_of"] + "T00:00:00Z"
            ))
            for e in issue["evidence"]:
                db.execute("""INSERT OR IGNORE INTO evidence VALUES (?,?,?,?,?,?,?,?,?)""", (
                    e["id"], issue["id"], e["source_label"], e["source_url"],
                    e["source_type"], e["published_on"], e["finding"], e["stance"],
                    seed["metadata"]["snapshot_as_of"] + "T00:00:00Z"
                ))


def rows(db: sqlite3.Connection, sql: str, params: tuple = ()) -> list[dict]:
    return [dict(r) for r in db.execute(sql, params).fetchall()]


def read_bundle(db_path: Path, seed: dict) -> dict:
    with connect(db_path) as db:
        issues = rows(db, "SELECT * FROM issues ORDER BY opened_on DESC, id")
        evidence = rows(db, "SELECT * FROM evidence ORDER BY published_on DESC, id")
        audit = rows(db, "SELECT * FROM audit ORDER BY at DESC, id")
        indicators = rows(db, "SELECT * FROM indicators ORDER BY year DESC, indicator, district")
        posts = rows(db, "SELECT * FROM social_posts ORDER BY published_on DESC, id")
    by_issue = {}
    for e in evidence:
        by_issue.setdefault(e["issue_id"], []).append(e)
    for i in issues:
        i["evidence"] = by_issue.get(i["id"], [])
        i["audit"] = [a for a in audit if a["issue_id"] == i["id"]]
    return {
        "metadata": seed["metadata"], "districts": seed["districts"],
        "election": seed["election"], "programme_metrics": seed["programme_metrics"],
        "district_highlights": seed["district_highlights"],
        "issues": issues, "playbooks": seed["playbooks"], "sources": seed["sources"],
        "indicators": indicators, "social_posts": posts, "mode": "server",
    }


def csv_rows(raw: str, required: list[str]) -> list[dict]:
    try:
        reader = csv.DictReader(io.StringIO(raw, newline=""))
        if not reader.fieldnames or not set(required).issubset(set(reader.fieldnames)):
            raise HTTPException(422, f"CSV requires columns: {', '.join(required)}")
        if any(not col or col.strip() != col for col in reader.fieldnames):
            raise HTTPException(422, "Remove empty/space-padded header names")
        result = list(reader)
        if len(result) > 5000:
            raise HTTPException(413, "Maximum 5,000 rows per import")
        if any(None in x for x in result):
            raise HTTPException(422, "CSV has more values than column headings")
        return result
    except csv.Error as e:
        raise HTTPException(422, f"Malformed CSV: {e}") from e


def nonnegative_int(raw: str | None, label: str, optional=False) -> int | None:
    if (raw is None or raw.strip() == "") and optional:
        return None
    try:
        n = int(raw)
    except (ValueError, TypeError):
        raise HTTPException(422, f"Invalid integer in {label}")
    if n < 0 or n > 2_000_000_000:
        raise HTTPException(422, f"Out-of-range value in {label}")
    return n


def check_issue(issue_id: str, db: sqlite3.Connection) -> dict:
    value = db.execute("SELECT * FROM issues WHERE id = ?", (issue_id,)).fetchone()
    if not value:
        raise HTTPException(404, "Issue not found")
    return dict(value)


def make_brief(issue: dict, election_source: str) -> str:
    def safe(value: str) -> str:
        return str(value).replace("\n", " ").replace("|", "\\|")
    parts = [
        f"# {safe(issue['title'])}", "",
        f"_TN Lens research brief · generated {date.today().isoformat()} · independent prototype_", "",
        f"**Issue ID:** `{issue['id']}`  ",
        f"**District:** {safe(issue['district'])}  ",
        f"**Category:** {safe(issue['category'])}  ",
        f"**Review status:** {safe(issue['status']).replace('_', ' ')}", "",
        "## What is being examined", "", safe(issue['summary']), "",
        "## Available source links", "",
    ]
    if not issue.get("evidence"):
        parts.append("No evidence links have been added. Do not present the claim as verified.")
    for ev in issue.get("evidence", []):
        parts.append(f"- **{safe(ev['published_on'])} · {safe(ev['source_type'])} / {safe(ev['stance'])}:** "
                     f"[{safe(ev['source_label'])}]({ev['source_url']}) — {safe(ev['finding'])}")
    parts += ["", "## Missing evidence / next research step", "", safe(issue['next_step']), ""]
    parts += ["## Review history", ""]
    if issue.get("audit"):
        for a in issue["audit"]:
            parts.append(f"- {safe(a['at'])}: {safe(a['event'])} — {safe(a['note'])}")
    else:
        parts.append("No reviewer decision recorded yet.")
    parts += ["", "---", "Organiser statements are not independent outcome audits. "
              "This briefing is for public-policy research and does not forecast elections or profile voters.", ""]
    return "\n".join(parts)


def create_app(db_path: Path | str | None = None, seed_path: Path | str = SEED) -> FastAPI:
    db_path = Path(db_path or os.getenv("TN_LENS_DB", str(DEFAULT_DB))).resolve()
    seed = json.loads(Path(seed_path).read_text(encoding="utf-8"))
    assert len(seed["districts"]) == 38
    assert sum(item["seats"] for item in seed["election"]["seats"]) == 234
    migrate_and_seed(db_path, seed)
    app = FastAPI(title="TN Lens — public evidence API", version="0.1.0")

    @app.get("/")
    def homepage():
        return FileResponse(ROOT / "static" / "index.html", media_type="text/html")

    @app.get("/api/health")
    def health():
        return {"ok": True, "version": "0.1.0", "database": "sqlite", "snapshot_as_of": seed["metadata"]["snapshot_as_of"]}

    @app.get("/api/bootstrap")
    def bootstrap():
        return read_bundle(db_path, seed)

    @app.get("/api/export")
    def export():
        return JSONResponse(read_bundle(db_path, seed), headers={"Content-Disposition":"attachment; filename=tn-lens-export.json"})

    @app.post("/api/issues", status_code=201)
    def new_issue(payload: NewIssue):
        valid_districts = set(seed["districts"]) | {"Statewide"}
        if payload.district not in valid_districts:
            raise HTTPException(422, "Unknown Tamil Nadu district")
        iid = "issue_" + uuid.uuid4().hex[:12]
        stamp = utcnow()
        with connect(db_path) as db:
            db.execute("INSERT INTO issues VALUES (?,?,?,?,?,?,?,?,?,?)", (
                iid, payload.title.strip(), payload.category.strip(), payload.district,
                payload.summary.strip(), "open_question", date.today().isoformat(),
                payload.next_step.strip(), stamp, stamp
            ))
            db.execute("INSERT INTO audit VALUES (?,?,?,?,?,?,?,?)", (
                "audit_" + uuid.uuid4().hex[:12], iid, "created", None, "open_question",
                "New case created; not independently verified", "Research workspace", stamp
            ))
        return {"id": iid, "status": "open_question"}

    @app.post("/api/issues/{issue_id}/evidence", status_code=201)
    def add_evidence(issue_id: str, payload: NewEvidence):
        if not valid_url(payload.source_url):
            raise HTTPException(422, "Use a valid HTTPS source URL")
        if payload.source_type not in SOURCE_TYPES or payload.stance not in STANCES:
            raise HTTPException(422, "Unsupported evidence type or stance")
        if not valid_date(payload.published_on):
            raise HTTPException(422, "Publication date must be YYYY-MM-DD")
        stamp = utcnow()
        eid = "ev_" + uuid.uuid4().hex[:12]
        with connect(db_path) as db:
            check_issue(issue_id, db)
            db.execute("INSERT INTO evidence VALUES (?,?,?,?,?,?,?,?,?)", (
                eid, issue_id, payload.source_label.strip(), payload.source_url,
                payload.source_type, payload.published_on, payload.finding.strip(), payload.stance, stamp
            ))
            db.execute("INSERT INTO audit VALUES (?,?,?,?,?,?,?,?)", (
                "audit_" + uuid.uuid4().hex[:12], issue_id, "evidence_added", None, None,
                f"Added {payload.source_type} evidence: {payload.source_label}", "Research workspace", stamp
            ))
            db.execute("UPDATE issues SET updated_at = ? WHERE id = ?", (stamp, issue_id))
        return {"id": eid, "issue_id": issue_id}

    @app.patch("/api/issues/{issue_id}/status")
    def review_issue(issue_id: str, payload: Review):
        if payload.status not in STATUS:
            raise HTTPException(422, "Unrecognized review status")
        stamp = utcnow()
        with connect(db_path) as db:
            issue = check_issue(issue_id, db)
            evidences = rows(db, "SELECT source_url, stance FROM evidence WHERE issue_id=?", (issue_id,))
            if payload.status == "corroborated" and len({host(e["source_url"]) for e in evidences}) < 2:
                raise HTTPException(422, "Corroborated requires at least two distinct source domains and a written human review")
            if payload.status == "resolved" and not any(e["stance"] == "outcome" for e in evidences):
                raise HTTPException(422, "Resolved requires an outcome evidence link")
            db.execute("UPDATE issues SET status=?, updated_at=? WHERE id=?", (payload.status, stamp, issue_id))
            db.execute("INSERT INTO audit VALUES (?,?,?,?,?,?,?,?)", (
                "audit_" + uuid.uuid4().hex[:12], issue_id, "human_review", issue["status"],
                payload.status, payload.note.strip(), payload.reviewer.strip(), stamp
            ))
        return {"id": issue_id, "previous_status": issue["status"], "status": payload.status}

    @app.get("/api/brief/{issue_id}")
    def brief(issue_id: str):
        bundle = read_bundle(db_path, seed)
        issue = next((x for x in bundle["issues"] if x["id"] == issue_id), None)
        if not issue:
            raise HTTPException(404, "Issue not found")
        content = make_brief(issue, seed["election"]["source_url"])
        return PlainTextResponse(content, media_type="text/markdown; charset=utf-8", headers={
            "Content-Disposition": f'attachment; filename="tn-lens-{issue_id}.md"'
        })

    @app.post("/api/social/import")
    def import_social(payload: CsvImport):
        expected = ["platform", "published_on", "topic", "post_url", "views", "likes", "comments", "shares"]
        records = csv_rows(payload.csv_text, expected)
        prepared = []
        for rownum, item in enumerate(records, start=2):
            platform = item["platform"].strip()
            post_url = item["post_url"].strip()
            topic = item["topic"].strip()
            published_on = item["published_on"].strip()
            if platform not in PLATFORM_HOSTS or not valid_url(post_url) or host(post_url) not in PLATFORM_HOSTS[platform]:
                raise HTTPException(422, f"Row {rownum}: platform and public post URL do not match supported domains")
            if not valid_date(published_on) or not 2 <= len(topic) <= 80:
                raise HTTPException(422, f"Row {rownum}: invalid date or topic")
            prepared.append(("post_" + uuid.uuid4().hex[:12], platform, published_on, topic, post_url,
                nonnegative_int(item["views"], "views", optional=True),
                nonnegative_int(item["likes"], "likes"),
                nonnegative_int(item["comments"], "comments"),
                nonnegative_int(item["shares"], "shares"), utcnow()))
        inserted = 0
        with connect(db_path) as db:
            for record in prepared:
                if db.execute("INSERT OR IGNORE INTO social_posts VALUES (?,?,?,?,?,?,?,?,?,?)", record).rowcount:
                    inserted += 1
        return {"received": len(prepared), "inserted": inserted, "duplicates": len(prepared)-inserted,
                "note": "Importer does not verify account ownership, representativeness or the authenticity of supplied metrics."}

    @app.post("/api/indicators/import")
    def import_indicators(payload: CsvImport):
        expected = ["district", "indicator", "year", "value", "unit", "source_label", "source_url"]
        records = csv_rows(payload.csv_text, expected)
        prepared = []
        for rownum, item in enumerate(records, start=2):
            dist, indicator = item["district"].strip(), item["indicator"].strip()
            source_url, label, unit = item["source_url"].strip(), item["source_label"].strip(), item["unit"].strip()
            if dist not in seed["districts"]:
                raise HTTPException(422, f"Row {rownum}: unknown district {dist}")
            if not 3 <= len(indicator) <= 100 or not 1 <= len(unit) <= 40 or not 3 <= len(label) <= 160 or not valid_url(source_url):
                raise HTTPException(422, f"Row {rownum}: missing/invalid source, unit or indicator")
            try:
                year = int(item["year"])
                value = float(item["value"])
            except (TypeError, ValueError):
                raise HTTPException(422, f"Row {rownum}: year and value must be numeric")
            if not 2000 <= year <= 2035 or not -1e12 <= value <= 1e12 or value != value:
                raise HTTPException(422, f"Row {rownum}: year or value outside allowed range")
            prepared.append(("ind_" + uuid.uuid4().hex[:12], dist, indicator, year, value,
                unit, label, source_url, "uploaded_unreviewed", utcnow()))
        inserted = 0
        with connect(db_path) as db:
            for record in prepared:
                if db.execute("INSERT OR IGNORE INTO indicators VALUES (?,?,?,?,?,?,?,?,?,?)", record).rowcount:
                    inserted += 1
        return {"received": len(prepared), "inserted": inserted, "duplicates": len(prepared)-inserted,
                "note": "Imported indicators remain unreviewed until source values are checked."}

    return app


app = create_app()
