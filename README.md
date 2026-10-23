# TN Lens — v0.2

**A working source-linked Tamil Nadu public-intelligence workspace.** Not affiliated with We The Leaders, K. Annamalai, or a government body.

The product records what was claimed, what public sources substantiate, what remains unknown, the next verifiable step, and who made a research review decision. It is intended for public-service research—not voter profiling, demographic targeting, election forecasts, or automated political persuasion.

## Use immediately — no installation

Open `static/index.html` in a modern browser. The file is **self-contained**: HTML, styles, JavaScript and the sourced starter snapshot are embedded. It uses browser `localStorage` where allowed and supports JSON export as backup. Some browsers block local storage for downloaded HTML files; if that happens, run the local server below or use a local static server (`python -m http.server`) and **export** your research before closing the page.

Included screens:

1. **Overview** — research queue and sourced programme figures.
2. **Issues & evidence** — create issues, add original links, record human status reviews and see append-only history.
3. **Tamil Nadu data** — source-linked 2026 historical Assembly results, 38 district names, three source-reported district highlights, CSV import for indicators.
4. **Social signals** — CSV import of aggregate metrics from public posts; counts/views/interactions by uploader-declared topic, not public-opinion inference.
5. **Global playbooks** — FixMyStreet, Decidim and vTaiwan as *pilot candidates*, with transfer limitations and pilot measures.
6. **Decision briefs** — download or copy source-linked Markdown summaries; no AI-generated claims.
7. **Source library** — register of public source sites and provenance.

## Run locally with persistent SQLite

Requires Python 3.11+.

```bash
cd tn-lens-mvp
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python build.py
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000`. Data is saved to `instance/tn_lens.sqlite3` (excluded from Git). Override with `TN_LENS_DB=/absolute/path/to/data.sqlite3` if desired.

The API endpoints are documented interactively at `http://127.0.0.1:8000/docs`. Main operations: `/api/bootstrap`, `/api/issues`, `/api/issues/{id}/evidence`, `/api/issues/{id}/status`, `/api/social/import`, `/api/indicators/import`, `/api/brief/{id}`, `/api/export`.

**IMPORTANT:** The API has **no authentication, access control, rate limits, or production hardening**. **Do not deploy its write endpoints publicly.** The server deliberately binds to localhost in these instructions. A publicly shareable *read-only per-visitor* preview can use static hosting as described below. For a multi-user production version add permissions, HTTPS, backups, anti-abuse, audit signing, and review moderation.

## Source-backed starter data (snapshot: 22 October 2026)

- **ECI historical result**: Tamil Nadu 2026 Assembly party seat results, 234 total. Source: official ECI detailed results link in `data/seed.json`. **Historical election results**, not current House composition and not predictive.
- **WTL July campaign**: 612 events and 392 leaders, 38 districts; from WTL's August 2026 newsletter. Organisation self-report, not an independent outcomes audit.
- **WTL August–September programme**: 2,700+ events, 640.28 reported tonnes collected, 13,24,262 saplings planted. Organisation self-report, not disposal or survival verification.
- **TASMAC case**: WTL 129-site report, government 717-shop closure directive (May), subsequent closure reporting (June), and August ministerial statement are linked **separately**. Disposition of all 129 WTL-listed shops remains open in the seed dataset.
- **NFHS-6**: Official release centre registered as a future data source; district values are **not ingested** in v0.1.

Source links and caveats are stored in `data/seed.json`. The platform never replaces missing indicators or social metrics with plausible-looking values.

## CSV import schemas

### Social posts

Use `examples/social_posts_template.csv`. Columns:

```csv
platform,published_on,topic,post_url,views,likes,comments,shares
```

Supported platform values: `X`, `Instagram`, `YouTube`, `Facebook`, `LinkedIn`, `Threads`. All links must be HTTPS and point at their corresponding public platform domain. `published_on` uses `YYYY-MM-DD`. Numeric values are nonnegative integers; `views` may be blank. One post URL is stored once. Do **not** upload individual user data, private messages, or scraped personal profiles; use your own authorised public-channel exports. The software **does not** authenticate metrics or account ownership.

### District indicator values

Use `examples/district_indicators_template.csv`. Columns:

```csv
district,indicator,year,value,unit,source_label,source_url
```

Exact Tamil Nadu district names used by the importer are in `data/seed.json`. Every imported district value is automatically marked `uploaded_unreviewed`. A **real, source-attributed** three-row example (`examples/wtl_july_events_source_attributed.csv`) contains organiser-reported public event counts; it is not an official district quality-of-life indicator.

The CSV parser supports quoted commas. Both imports reject invalid rows as a batch and deduplicate by post URL or `(district,indicator,year,source_url)`.

## Evidence status and gates

Issues start as `open_question`. Researchers may set `needs_verification`, `in_review`, `corroborated`, `disputed`, or `resolved`, but only with a reason entered into the append-only review history. `corroborated` requires sources from at least two distinct host domains **and explicit human judgment**; two domains alone never prove a claim true. `resolved` requires a source tagged as `outcome`. Avoid sensitive personal details. No automatic verdict is made.

## Run tests

```bash
pip install -r requirements-dev.txt
pytest -q
```

The tests cover starting source data, issues, evidence, decision gates, generated briefings, CSV validity and atomic rejection, deduplication, and exports. Browser rendering and local UI interactions were also checked with Chromium during initial development.

## Edit and rebuild

- `data/seed.json` — versioned public-source starter evidence, districts, policy examples.
- `static/styles.css` and `static/app.js` — maintainable frontend source.
- `templates/index.template.html` — page layout.
- `build.py` — embeds everything into the portable `static/index.html`.
- `app/main.py` — FastAPI + SQLite backend and import validation.

Run `python build.py` after modifying the frontend or seed. The standalone file is **generated**; do not make your only edits to `static/index.html`.

## Sharing and deployment

The fastest public preview is **static hosting** (Render Static Site, GitHub Pages, or similar). The checked-in `render.yaml` is configured for a static preview. Visitors will each have their own browser-local copy; no visitors can edit shared data or see another visitor's local records.

To deploy on Render after pushing this project to a GitHub repository: create a new Static Site from that repo; build command `python build.py`, publish directory `static`. Do not deploy the FastAPI/SQLite service publicly until authentication and authorization are implemented.

The source repository is https://github.com/Soldsoul86/tn-lens. The public preview uses static hosting; the unauthenticated API is not deployed.

## Suggested v0.2 work — evidence first

1. Import **real NFHS-6 Tamil Nadu district indicators** with page references and year metadata; first establish source completeness and reuse rights.
2. Add official document change tracking with diffs, manual acceptance and source snapshots. Avoid scraping social platforms in violation of their rules.
3. Introduce researcher accounts, evidence review permissions and source correction history **before** public shared editing.
4. Test one public-service pilot with a cooperating local body: measure baseline, official response time and verified resolution, not media impressions.
5. Invite independent researchers to challenge conclusions and attach contrary evidence. Document the methods and uncertainty.
## Tamil Nadu 2031 development view (v0.2)

The new **Tamil Nadu 2031** section connects attributed public programme themes or clearly-labelled independent civic aspirations to observable development outcomes. Seven research compacts cover livelihoods, learning, primary care, water, environmental outcomes, public safety and service delivery. Each records possible indicators, institutional responsibility, policy options, feasibility constraints and a testable pilot.

Official and public-source context is dated; numeric 2031 targets and district baselines remain **unset** until verifiable data and review exist. No political endorsement, party ranking, voter profiling, election forecast or causal impact claim is implied. Select any compact and export its source-linked Markdown development note.

Data: `data/development2031.json`. Methodology and caveats: `DEVELOPMENT_2031.md`. The Render public static preview embeds the catalog at build time through `build.py`; it is not a live API feed.


## v0.3 — Social-first cascade dashboard

The first screen is now **Social dashboard**, with a waterfall drilldown from platform → uploader-declared theme → original public post → manually selected 2031 development compact. It features filters for YouTube, Instagram and other supported platforms, publication-date selection, source-level data coverage, an additive interactions waterfall, source details and a Markdown evidence export.

No live platform APIs are connected and **no synthetic engagement metrics are shown**. Import authorised public-post CSVs via the on-screen control. Metrics are importer-supplied and not independently verified; views and engagement are neither population sentiment nor voting intent. The publication-date filter does not measure when cumulative views occurred. Browser-local records are not shared between visitors.

See [SOCIAL_DASHBOARD.md](SOCIAL_DASHBOARD.md) for data provenance, API constraints, waterfall definitions, known limitations and manual acceptance checks. Run the four extra deterministic tests with `node --test tests/test_social_dashboard.cjs`.

## Ground Loop — proposed one-next-step chat pilot (October 2026)

Open `static/loop/index.html` locally or `/loop/` on the Render static preview. This **fully synthetic browser-local interactive demo** illustrates the proposed flow: participant opt-in → one next step → progress or help request → field coordinator queue → human evidence review → aggregate leadership waterfall. It includes an illustrative volunteer-hour capacity scenario and downloadable aggregate briefing.

The demo **does not** message real participants, send data to a shared server, integrate with WTL's app, provide genuine employment evidence, or operate WhatsApp automation. All built-in records are fiction; browser-created demo records are local only. The operational design and safeguards are in `docs/GROUND_LOOP_TECH_DESIGN.md` and a one-page draft is in `briefs/GROUND_LOOP_ONE_PAGE.md`.

Run the logic acceptance test: `node tests/test_loop_logic.cjs`. Meta's WhatsApp Business Platform policy currently prohibits political parties, politicians, candidates and campaigns; a standalone web chat avoids assuming that API is available.
