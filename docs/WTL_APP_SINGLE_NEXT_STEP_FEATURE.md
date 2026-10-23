# WTL app enhancement: My Next Step

**Independent integration proposal · 23 October 2026 · NOT implemented in WTL's production app.**

## Why this is one addition rather than a new product

The existing We The Leaders mobile app already has Home, Events, Reels, Profile, event registration/check-in, photo proof and service impact reporting. WTL's November 2026 youth-skilling theme calls for **one practical next step for every participant**.

Add exactly one **My Next Step** card to **Events → My Events → Attended event**.

- **No new app, new account, bottom navigation item, new attendance flow or duplicate registry.**
- A concise in-app guided conversation asks the participant to select one concrete post-event action (CV review, mentor, apprenticeship pathway; configurable per event).
- A later check-in offers **In progress / Completed / Need help / Stop tracking**. Completion is self-reported until reviewed; it is not evidence of employment.
- **Need help** creates a permissioned support item in the existing organiser's event-management tools; a coordinator acknowledges, refers or closes it.
- Authorised leadership sees only **aggregated** opt-in rates, next-step completion, unknown follow-ups, open support needs, evidence quality and volunteer-hours.

**Loop:** Event → next step → participant update → coordinator action → aggregate patterns → resource decision → measured result.

Example: repeated mentor-access requests may motivate a capacity or partnership test. Whether that intervention improved results must be independently measured; the tool must not automatically recommend a political or public-service allocation.

## Minimal data extensions to existing WTL services

- `next_steps`: opaque ID, event ID, existing member reference (restricted), action type, target date, consent version, status, timestamps, evidence tier.
- `next_step_updates`: append-only status change, timestamp, actor role, evidence link (restricted), reason.
- `support_requests`: event ID, next-step ID, blocker category, assigned event coordinator, acknowledged/referred/resolved state and response time.
- `aggregate_reports`: programme/event/time-window counts, denominators, unanswered/unknown outcomes, verified-versus-reported distinction and small-cell privacy safeguards.

API operations: create next step for a checked-in event participant; update own step; fetch assigned event support requests; record coordinator response; fetch permission-checked aggregate report. Use WTL's existing auth and role permissions, rather than establishing a parallel login.

## Critical boundaries

The uploaded screenshots show WTL also has an initial survey about grassroots and electoral leadership. **Do not join those survey answers to eligibility for development help, next-step status, or public-service resource decisions.** No individual member IDs, phone numbers, DOB or political preferences in leadership reports. Participation is voluntary and refusal has no adverse consequences. Consent, withdrawal, access controls, retention and deletion need review.

The supplied screenshots are personal and must **not** be added unredacted to public GitHub.

## Product acceptance checks

1. Attended-event member sees the card; existing RSVP/check-in/photo proof is unchanged.
2. One active next step per member/event, with auditable update history.
3. Need-help item is visible only to an assigned organiser, not all leaders or members.
4. A self-reported completion cannot appear as independently verified.
5. All leadership numbers expose the time range, denominator, unknown count and provenance; personal/member-level drill-down is inaccessible.
6. Participant can decline or stop tracking without changing existing WTL membership or public-service access.
7. Tamil/English copy and accessibility; assisted offline input for people who cannot use the app.

## Approvals needed for a real implementation

WTL product owner: confirm the feature doesn't already exist, approve placement and a pilot.
WTL engineering owner: access to the codebase, event/attendance APIs, permissions and staging environment.
WTL privacy and field owners: purpose-limited consent, a support escalation owner and outcome-verification procedure.

## Concept demonstration

A standalone, synthetic-data UI mockup is available from the author as a **non-production integration concept**. It deliberately does **not** connect to WTL's app, members, servers or official accounts. No live rollout is claimed.

## Sources

- WTL mobile app: https://play.google.com/store/apps/details?id=com.wetheleaders.wtlfapp
- WTL support and photo proof: https://www.wetheleader.org/support
- WTL youth-skilling theme: https://www.wetheleader.org/theme-detail?theme=youth-skilling-empowerment
