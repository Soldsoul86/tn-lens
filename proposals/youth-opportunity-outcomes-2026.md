# TN Lens research contribution 001 — Youth opportunity follow-through

**As of:** 23 October 2026
**Status:** Evidence-based pilot proposal; not launched, endorsed by, or integrated with We The Leaders.
**Purpose:** Measure whether a voluntary youth-skilling intervention produces independently checkable next steps and useful employment-related outcomes, rather than counting events, social views or attendance as impact.

## Why this is timely

We The Leaders (WTL) lists **Youth Skilling and Empowerment** as its planned November 2026 theme. The published programme invites **234 constituencies** to host at least one activity; it calls for **one practical next step per participant**. The page mentions mentoring circles, job-readiness clinics, digital-skills labs, apprenticeship meets and portfolio reviews. Source: https://www.wetheleader.org/theme-detail?theme=youth-skilling-empowerment

In a parliamentary answer published on **2 April 2026**, the Ministry of Labour and Employment reported Tamil Nadu's unemployment rate for ages **15–29**, on the PLFS usual-status definition, at **15.3% in 2023–24**, down from **25.6% in 2017–18**. These statistics are population-level context, not an estimate of WTL participant outcomes. Source: https://sansad.in/getFile/annex/270/AU4425_rb0X0m.pdf?source=pqars

Tamil Nadu already provides public skilling, internship and apprenticeship programmes through **Naan Mudhalvan**; the pilot should link verified opportunities rather than replicate or displace existing services. Source: https://naanmudhalvan.tn.gov.in/

WTL already reports activities and publishes impact materials. This proposal does **not** assert that it lacks internal follow-up capabilities; whether an outcome-verification workflow already exists must be asked explicitly. Sources: https://www.wetheleader.org/impact and https://www.wetheleader.org/support

## Single research question

> Of consenting participants who attend a November youth-skilling action and accept a defined next step, what proportion actually completes that step within 30 days, and what independently documented opportunity outcomes exist at 90 days?

Do not describe reported outcomes as caused by the intervention without an appropriate evaluation design.

## Minimum viable pilot: one cooperating venue / constituency

- **Scope:** Up to 50 consenting adults as a pilot target, not a claim of actual participation. No political affiliation data, voter records, persuasion objectives, or identification of voters.
- **Public social listening:** Manually review a dated set of permitted public YouTube / Instagram posts about training and employment; record *aggregated issue categories*, accessible post links and uncertainties. Do not identify users, infer their residence or political views, or equate platform engagement with population preferences.
- **Before the event:** A participating institution identifies one specific barrier, such as lack of a portfolio, mentor or reliable apprenticeship information.
- **At the event:** Give each consenting participant one recorded, concrete and voluntary next step, a due date and a relevant public-service link. A privacy-preserving evaluation partner—not a political CRM—holds individual contact details.
- **30 days:** Report aggregate number of participants completing the next step, with evidence category and the number lost to follow-up.
- **90 days:** Report independently checkable interviews, applications, apprenticeship starts or paid placements with verification limitations. Do not imply a guaranteed job.
- **Public output:** One anonymised cohort dashboard and one source-linked case report, including unsuccessful steps and corrections.

## Waterfall and denominators

1. Attended workshop (count; organiser evidence)
2. Opted into independent follow-up (count; clear consent, numerator/denominator)
3. Received one documented next step (count)
4. Completed next step within 30 days (count; evidence type)
5. Reached application / interview / apprenticeship milestone within 90 days (count)
6. Sustained paid work or apprenticeship at 90 days (count, where voluntarily verifiable)

Every conversion uses a stated denominator. People who cannot be contacted are displayed as **unknown / lost to follow-up**, not failures or successes. Do not combine mutually overlapping milestones into an additive funnel.

## Data model (minimal)

`event_id`, `event_date`, `programme_type`, `aggregate_area`, `consent_count`, `next_step_category`, `next_step_due_date`, `30_day_completed_count`, `30_day_unknown_count`, `90_day_opportunity_count`, `90_day_unknown_count`, `evidence_quality`, `data_owner`, `last_checked_at`, `source_link`, `limitations`.

Avoid public participant-level IDs, phone numbers, private employment records or employer identifiers unless strictly required by a trusted evaluation partner and separately consented to. Publish only sufficiently aggregated counts.

## What TN Lens should add

1. **One new dashboard:** `Opportunity Outcomes`; aggregate 30/90-day conversion waterfall, with filters by programme format and time window (no personal political targeting).
2. **One drill-down:** Programme → event → outcome measure → supporting source / verification status.
3. **One import:** Aggregated cohort CSV, with schema validation, provenance and deduplication.
4. **One export:** Source-linked Markdown/PDF outcome brief with denominator and missingness.
5. **One validation test:** A 90-day job placement cannot appear as verified without a verification basis; unknown counts are never silently discarded.

## Gates before collecting actual participant data

- Identify a legitimate delivery institution and a separate data controller/evaluation partner.
- Confirm WTL's existing event reporting and ask whether it already measures post-event outcomes.
- Obtain clear, purpose-limited consent for follow-up; provide deletion, refusal and correction paths.
- Keep service data segregated from any electoral/campaign membership or messaging system.
- Design an evaluation strategy and obtain needed local approvals before publishing outcome claims.

## Two-week build scope

- **Days 1–3:** Finalise outcome definitions, data rights and source registry; design a fixture-only dashboard.
- **Days 4–7:** Build aggregate CSV import, validations, drill-down and source links in TN Lens.
- **Days 8–10:** Conduct independent review of the methodology and test empty/contradictory data states.
- **Days 11–14:** Demonstrate the workflow with clearly labelled synthetic test data; seek a cooperating delivery institution before real-data collection.

**Acceptance criterion:** A reviewer can choose an outcome count, see its denominator, time window, source, confirmation status and uncertainty, and reproduce the exported brief.

**Non-goals:** campaign optimisation, political sentiment prediction, voter profiling, targeting, invented social metrics or claims of causality from an uncontrolled pilot.
