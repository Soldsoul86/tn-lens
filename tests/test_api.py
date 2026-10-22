"""Focused acceptance tests for TN Lens's first public-evidence workflow."""
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from app.main import create_app


@pytest.fixture
def api(tmp_path: Path):
    app = create_app(db_path=tmp_path / "isolated.sqlite3")
    with TestClient(app) as client:
        yield client


def test_initial_snapshot_is_source_linked_and_correctly_scoped(api):
    assert api.get("/api/health").json()["ok"] is True
    r = api.get("/api/bootstrap")
    assert r.status_code == 200
    d = r.json()
    assert d["mode"] == "server"
    assert len(d["districts"]) == 38
    assert d["election"]["total_seats"] == 234
    assert sum(p["seats"] for p in d["election"]["seats"]) == 234
    assert len(d["issues"]) == 3
    assert all(issue["evidence"] for issue in d["issues"])
    assert all(m["verification"] == "organiser_reported" for m in d["programme_metrics"])
    assert d["social_posts"] == []
    assert d["indicators"] == []
    assert "Not affiliated" in d["metadata"]["affiliation"]


def new_issue(api):
    p = {"title": "District streetlight outage evidence check", "category": "Infrastructure",
         "district": "Chennai", "summary": "Citizen service channels contain questions about streetlight repair turnaround and complaints.",
         "next_step": "Retrieve the municipal complaint register and record resolution dates."}
    r = api.post("/api/issues", json=p)
    assert r.status_code == 201, r.text
    return r.json()["id"]


def test_issue_source_review_and_brief_workflow(api):
    iid = new_issue(api)
    data = api.get("/api/bootstrap").json()
    issue = next(x for x in data["issues"] if x["id"] == iid)
    assert issue["status"] == "open_question"
    assert issue["audit"][0]["event"] == "created"
    review = {"status": "corroborated", "reviewer": "Evidence editor", "note": "The available sources independently substantiate the public question."}
    assert api.patch(f"/api/issues/{iid}/status", json=review).status_code == 422
    source = {"source_label": "Municipal repair register", "source_url": "https://chennai.nic.in/services/", "source_type": "government",
              "published_on": "2026-10-19", "finding": "Municipal service register exists but record-level verification is outstanding.", "stance": "context"}
    assert api.post(f"/api/issues/{iid}/evidence", json=source).status_code == 201
    assert api.patch(f"/api/issues/{iid}/status", json=review).status_code == 422
    source2 = {"source_label": "Independent published review", "source_url": "https://example.org/municipal-review", "source_type": "research",
               "published_on": "2026-10-20", "finding": "Published review examines municipal reports but not all closed tickets.", "stance": "supports"}
    assert api.post(f"/api/issues/{iid}/evidence", json=source2).status_code == 201
    reviewed = api.patch(f"/api/issues/{iid}/status", json=review)
    assert reviewed.status_code == 200, reviewed.text
    assert reviewed.json()["status"] == "corroborated"
    assert api.patch(f"/api/issues/{iid}/status", json={**review, "status": "resolved"}).status_code == 422
    outcome = {**source2, "source_url":"https://example.net/verified-fix", "stance":"outcome",
               "finding": "Documented outcome establishes a specific repair was completed and inspected."}
    assert api.post(f"/api/issues/{iid}/evidence", json=outcome).status_code == 201
    assert api.patch(f"/api/issues/{iid}/status", json={**review, "status": "resolved"}).status_code == 200
    issue = next(x for x in api.get("/api/bootstrap").json()["issues"] if x["id"] == iid)
    assert len(issue["evidence"]) == 3
    assert len(issue["audit"]) == 6  # created + evidence(3) + review(2)
    assert issue["status"] == "resolved"
    brief = api.get(f"/api/brief/{iid}")
    assert brief.status_code == 200
    assert "Municipal repair register" in brief.text
    assert "verified-fix" in brief.text
    assert "Human" not in brief.headers.get("content-type", "")  # Markdown export, not AI output
    assert api.get("/api/brief/not-an-issue").status_code == 404


def test_evidence_has_https_and_review_note_validation(api):
    iid = new_issue(api)
    invalid = {"source_label": "Untrusted source", "source_url":"javascript:alert(1)", "source_type":"reporting",
               "published_on":"2026-10-20", "finding":"This line is lengthy enough to be evidence.", "stance":"context"}
    assert api.post(f"/api/issues/{iid}/evidence", json=invalid).status_code == 422
    invalid["source_url"] = "https://example.org/report"
    invalid["published_on"] = "2026-35-40"
    assert api.post(f"/api/issues/{iid}/evidence", json=invalid).status_code == 422
    assert api.patch(f"/api/issues/{iid}/status",json={"status":"in_review","note":"short"}).status_code == 422
    assert api.post("/api/issues", json={"title":"Illegal", "category":"Other", "district":"Fake District", "summary":"X"*30,"next_step":"Y"*20}).status_code == 422


def test_social_metrics_import_validates_url_and_dedupes(api):
    good = "platform,published_on,topic,post_url,views,likes,comments,shares\nYouTube,2026-10-20,Public Health,https://www.youtube.com/watch?v=test123,900,20,4,2\nX,2026-10-21,Water Supply,https://x.com/wetheleaders/status/12345,,12,2,1\n"
    first = api.post("/api/social/import", json={"csv_text":good})
    assert first.status_code == 200, first.text
    assert first.json()["inserted"] == 2
    again=api.post("/api/social/import",json={"csv_text":good})
    assert again.json()["duplicates"] == 2
    p=api.get("/api/bootstrap").json()["social_posts"]
    assert len(p)==2
    assert next(x for x in p if x["platform"]=="X")["views"] is None
    bad = good.replace("https://x.com/wetheleaders/status/12345", "https://malicious.example/p/1")
    assert api.post("/api/social/import",json={"csv_text":bad}).status_code == 422
    assert len(api.get("/api/bootstrap").json()["social_posts"]) == 2  # atomic rejection


def test_district_import_is_source_attributed_unreviewed_and_idempotent(api):
    good = "district,indicator,year,value,unit,source_label,source_url\nMadurai,Test Public Indicator,2025,72.5,percent,Demo only,https://example.org/sample.csv\nChennai,Test Public Indicator,2025,81.0,percent,Demo only,https://example.org/sample.csv\n"
    assert api.post("/api/indicators/import",json={"csv_text":good}).json()["inserted"]==2
    assert api.post("/api/indicators/import",json={"csv_text":good}).json()["duplicates"]==2
    items=api.get("/api/bootstrap").json()["indicators"]
    assert all(x["verification"]=="uploaded_unreviewed" for x in items)
    assert len(items)==2
    bad=good.replace("Madurai", "NotARealDistrict")
    assert api.post("/api/indicators/import",json={"csv_text":bad}).status_code==422
    assert len(api.get("/api/bootstrap").json()["indicators"])==2


def test_export_has_local_changes(api):
    iid=new_issue(api)
    exported=api.get('/api/export')
    assert exported.status_code==200
    assert 'attachment' in exported.headers['content-disposition']
    assert any(x['id']==iid for x in exported.json()['issues'])
    assert api.get('/').status_code==200
    assert 'TN Lens' in api.get('/').text
