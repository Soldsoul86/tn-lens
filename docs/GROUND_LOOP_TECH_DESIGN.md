# TN Lens Ground Loop — a next-step-to-evidence civic service

**Design status:** Working static chat demonstration and architecture for a proposed WTL November 2026 youth-skilling pilot. Not approved, endorsed, operated by, or connected to WTL. Prepared 23 October 2026.

## 1. Why this is the right abstraction

WTL's November 2026 public plan calls for one practical next step for every participant at youth-skilling events across invited constituencies. WTL also already publishes activity and impact records. The opportunity is therefore **not** to collect another event count; it is to test a reusable **closed loop between each voluntary next step, a human response, verified progress and aggregate institutional learning**.

The loop should create two benefits without conflating them:

- **Individual:** a feasible next action, progress tracking, available support, opt-out, and a clear explanation of who may respond.
- **Public service / leadership:** a trustworthy *aggregate* pattern of blockers, available delivery resources, support actions, unknown outcomes and verifiable next-step completion to inform transparent resource allocation.

**Rule:** a social interaction, an event, a self-reported completion, a reviewed completion and an actual employment result are five different things. Do not combine them into one impact number.

## 2. Participant: guided chat as a mobile web page

**Entry:** A printed QR after a workshop, a direct web link, an optional link under public YouTube/Instagram posts, or an assisted paper-to-digital entry by an authorised worker. A QR must identify the event but **must not embed a person's identity**. Make Tamil-first with English support and accessible controls.

**First screen:** explain service purpose, controller/partner, consent choices, time limits, what will be shared with field staff, and that it is **not** a political membership list. The participant can decline without disadvantage. The local demo does not collect actual consent to a live service.

**Guided sequence:**
1. Select **one** next step (CV, portfolio, apprenticeship route, mentoring).
2. Set a feasible target date and choose any partner/public resource needed. Participants can choose a step not represented by a preset category in later versions.
3. View a private link/token to resume; optional contact and reminders only in a separately authorised and consented delivery service, not exposed in TN Lens dashboards.
4. At follow-up, submit Started / Need help (select blocker category) / Report completed / Withdraw. No political-content prompts, affiliations, vote intention or private DMs.
5. Where appropriate, an authorised human partner checks independent evidence. Store the result as **reviewed** with evidence quality; don't turn self-report into 'verified' automatically.

**Example conversation (illustrative, not actual data):**
- Assistant: “What is the one practical step you can take after today's workshop?”
- Participant: “Get feedback on my CV.”
- Assistant: “You chose a CV review. Would a seven-day target work? Do you need mentor help?”
- Participant: “Yes; I need guidance.”
- System: “A support need has been recorded in this service. A field coordinator may respond subject to availability. This is not a guarantee.”

## 3. Field desk: act rather than just observe

A coordinator sees **only cases they are authorised to serve**. A limited queue shows case ID, next step, blocker type, due date and the minimum information necessary to offer assistance; sensitive contact information remains separately permissioned. Actions: offer a mentor, refer to Naan Mudhalvan or another appropriate existing programme, clarify eligibility, record human response, request evidence for a claimed completion, and escalate an unresolved institutional barrier.

Every human follow-up emits an auditable outcome event (who had authority, when, what type of support was offered, whether it was accepted, what remains unknown). An offered referral is **not** a completed placement.

## 4. Leadership: aggregate patterns, not individuals

**Executive questions:**
- How many consenting participants chose a step, began it, reported completion, and had that completion reviewed within 30 or 90 days?
- Which non-sensitive support needs are recurring, and what resources are genuinely limiting throughput?
- Which interventions have credible outcomes, at what cost and volunteer-hour expense? What remains unmeasured?
- What is the next smallest test that could reduce uncertainty before allocating more resources?

**Top-level metrics:** count + denominator + timeframe + verification tier + missing/unknown + source system. Use a **cumulative funnel**, not an additive waterfall of mutually overlapping milestones. Show the attrition between stages and allow drill-down to methods and underlying evidence after role checks.

**Safety boundary:** default reports contain sufficiently aggregated figures, no mobile numbers, no member lists, no ideology scores, no voter-level maps, no persuasion or election-messaging features. Public-services should not be conditioned on party membership or political support.

## 5. Proposed architecture

```text
Mobile browser chat (PWA) / assisted event intake
       ↓ HTTPS, explicit opt-in, anti-abuse
Case service with one anonymous/pseudonymous reference
       ↓ append-only lifecycle events
Coordinator queue (verified roles, purpose-limited access)
       ↓ response / referral / human evidence review
Aggregate outcome worker (small-count privacy suppression)
       ↓ daily typed statistics + limitations
TN Lens decision cockpit: barrier → intervention → cost → outcome
```

Minimal typed event schema (illustrative):

```json
{
  "case_ref": "opaque-random-id",
  "event_ref": "non-personal-event-id",
  "programme": "youth-skilling",
  "next_step_type": "cv-review",
  "state": "needs_help",
  "barrier_type": "mentor_access",
  "event_time": "ISO8601",
  "actor_role": "participant",
  "evidence_tier": "self_report",
  "consent_scope_ref": "separate-record-id",
  "source_version": 1
}
```

For a live system: encrypt private case storage, minimise retention, implement least-privilege role access, legal/privacy review, consent and withdrawal, data export/deletion, rate limiting, backups, moderation, incident response and partner-level agreements. Require authorisation from WTL if connecting to its infrastructure. Where possible, build as a **module/API connector to WTL's existing app**, not a competing registry.

**Channel restriction:** Meta's current WhatsApp Business Messaging Policy prohibits the WhatsApp Business Platform for political parties, politicians and political campaigns. A direct WhatsApp Cloud API bot is therefore **not the assumed channel**. Use a mobile browser chat/PWA and approved neutral service channels, not an API workaround under another party's identity. Check all platform policies before integrating.

Policy source: https://whatsappbusiness.com/policy/

## 6. Pilot and resource decisions

**First technical demo:** the standalone browser-based chat at `loop/` creates only fictitious or user-operated *local* records, displays a field queue and an aggregate decision funnel. It sends **no messages** and does not send case data to a server. This validates the interaction model, not the full operational system.

**One-venue pilot, only with permission:** up to 50 consenting adults as a design ceiling, a trusted institution/mentor coordinator, a documented source-of-truth integration, and a 30/90-day measurement protocol. Define dropout handling, accessible alternatives and what will be published before collecting data.

The leadership resource question is **not** “How do we generate more volunteer conversations?” It is “What is the next marginal unit of mentorship, referral capacity or local programme effort that can actually remove a repeated obstacle?” Answer only after measuring the baseline and opportunity costs.

Suggested first acceptance gates:
1. Every new case has an opt-in record, precisely one current next step, and a due date.
2. Need-help events appear to authorised coordinators and can be acknowledged without automatic political profiling.
3. Self-reports, human-reviewed completions and independently evidenced real-world opportunities are separated and auditable.
4. Aggregate counts include denominators and missingness, with privacy-preserving drill-down.
5. Leaders can see a resource bottleneck and change a documented allocation assumption without fabricated ROI.
6. A participant can withdraw and still access public resources through another route.

## Sources

- WTL Youth Skilling and Empowerment, November 2026: https://www.wetheleader.org/theme-detail?theme=youth-skilling-empowerment
- WTL mission and impact record approach: https://www.wetheleader.org/
- WhatsApp Business Messaging Policy, political use: https://whatsappbusiness.com/policy/
- Tamil Nadu Naan Mudhalvan: https://naanmudhalvan.tn.gov.in/

**Status note:** The public TN Lens demo is a static website with browser-local data. Real participant intake, automated reminders, private coordinator access, encrypted central storage and WTL integration have **not** been implemented.
