# TN Lens — Leadership Decision Intelligence

**Status:** Proposed product direction, 23 October 2026. Independent, public-interest research prototype; not an official WTL system or an endorsement of a political actor.

## The fundamental shift

**From:** Which posts, districts or programmes generated the most activity?

**To:** Given finite resources, which feasible public-interest interventions should be investigated, piloted, continued, stopped or scaled—under uncertainty and with a defensible account of their effects on Tamil Nadu residents?

TN Lens should improve the leader's **quality of decisions**, not predict elections or optimise persuasion. Politicians and public-interest organisations can use neutral, transparent policy evidence; individual voter data and electoral segmentation are out of scope.

A strong interaction starts with a **decision awaiting approval**, not a chart:
- What has to be decided, by whom, and by when?
- What public development outcome is sought and over what time horizon?
- What resources are constrained? (₹ budget, volunteer-hours, qualified mentors, implementing institutions, credibility, decision attention)
- What credible alternatives exist, including doing nothing or partnering with an existing programme?
- How much public benefit, cost and delivery risk does each entail? What is unknown?
- What evidence would lead to a different choice?
- How will actual outcomes be measured and reviewed?

## Layer 1: Reality, not the feed

Sources of record:
1. **Tamil Nadu development indicators:** Tamil Nadu Department of Economics and Statistics, district handbooks, state SDG indicator framework, departmental records. Keep geography, measurement year, definition, source URL, confidence and publication lag.
2. **Movement activities:** WTL's published theme plans, field event reports and self-reported activity counts, always labelled as organiser reports rather than audited outcomes.
3. **Public social signals:** authorised public posts from YouTube and Instagram. Extract issue themes, claims, documented examples, changes over time and linked source URLs. Post reach is *not representative public opinion*; never infer a person's vote intention or political affiliation.
4. **Transferable models:** documented public-service playbooks with evidence quality, failure conditions, administrative prerequisites and implementation cost.
5. **Institutional feasibility:** public agency responsible, legal powers, delivery partners, implementation bottlenecks, long-term maintenance and whether WTL can act directly or only advocate / coordinate.

Avoid conflating public-service allocation with electoral resource allocation. District public-need criteria should be transparent and non-electoral.

## Layer 2: Decision portfolio

Each decision object contains:
```json
{
  "id": "decision-001",
  "title": "November youth skilling: breadth versus verified outcomes",
  "decision_owner": "To be confirmed",
  "deadline": "To be confirmed",
  "development_goal_id": "productive-jobs",
  "objective_statement": "To be agreed with decision owner",
  "constraints": {
    "budget_inr": null,
    "volunteer_hours": null,
    "partner_capacity": null,
    "implementation_window_days": null
  },
  "alternatives": [],
  "source_register": [],
  "impact_measure_definition": null,
  "confidence": "unassessed",
  "dissenting_evidence": [],
  "decision": "pending",
  "review_date": null,
  "outcome_audit": []
}
```

No placeholder is a factual value. An unexplained single ranking score is prohibited. Show **trade-offs and a Pareto frontier** where comparable model estimates exist; otherwise show a qualified narrative comparison and the most valuable information to gather next.

## Layer 3: Resource allocation mathematics (when inputs exist)

Let `x[i]` represent resources committed to a public-service intervention `i`, with measurable outcome function `O[i](x)`. Subject to real constraints:

- Financial: `sum(cost[i](x[i])) <= B`
- Field capacity: `sum(hours[i](x[i])) <= H`
- Delivery capacity and dependencies: each intervention has a feasible range / milestones
- Equity and accessibility: minimum public-service standards established openly
- Uncertainty: evaluate multiple measured sensitivity scenarios; if evidence is too weak, commission a small pilot instead of claiming an optimum

Because outcomes differ in units (earnings, treatment delays, sapling survival), don't collapse them into an arbitrary single 'impact score'. Ask leadership which outcomes are non-negotiable and which trade-offs it accepts, then compare constrained alternatives. Track the **marginal effect of the next ₹1 lakh or next 100 volunteer-hours** only after the necessary cost and outcome information exists.

## The executive screen

**Top row — decisions to make**
- A decision queue with deadline, alternatives, constrained resource and missing evidence
- New/changed facts that might reverse an earlier decision
- Issues whose evidence is stale or contradictory

**Middle row — portfolio trade-offs**
- Public development goal → programme → accountable institution → real intervention
- Resource-allocation scenarios with assumption sliders for available money, volunteer-hours and delivery capacity
- Benefits / disbenefits, evidence confidence, feasibility, time to outcome, equity and downside risk
- 'What would change this?' dissent and assumption log

**Bottom row — waterfall drill-down**
Decision → public problem → baseline → alternative → resource estimate → field implementation → 30/90-day outcome → primary evidence → repeat/stop/scale decision

**Adjacent social rail**
YouTube/Instagram topic signals → dated public posts → evidence-backed issue hypotheses → links to actual development indicators. **No sentiment score, ideological inference, voter profiling or political targeting.**

## A monthly leadership cadence

- **Weekly:** 1-page decision note: decision needed, 2–3 options, differences, strongest evidence, counterargument, missing facts, single ask.
- **Monthly:** budget / volunteer hour allocations vs plan; pilots started, verified results, dropouts, newly disproven assumptions and stop/continue decisions.
- **Quarterly:** development indicator update and performance audit; discontinue weakly supported activities and publish correction history where feasible.

## First demonstration decision

**November 2026 youth-skilling theme**. Official WTL public site invites action in 234 constituencies and asks every participant to receive one practical next step. The immediate leader-level question is **what share of scarce effort should go into event reach, credible delivery partnerships, and verifiable follow-through**, rather than number of events alone.

See `briefs/DECISION_001_YOUTH_2026.md`.

## Next product acceptance criteria

1. A leader can open a specific decision and inspect alternatives without navigating through seven unrelated screens.
2. No projected ROI is shown before actual cost and outcome evidence is entered.
3. Every observed number has a provenance link, geography, timeframe and verification label.
4. A scenario screen exposes missing constraints and uncertainty rather than filling them with fabricated values.
5. Changing an assumption can change the comparison in an auditable manner.
6. There is a named accountable institution and non-electoral basis for any field allocation.
7. Decision records can be exported as source-linked one-page memos.
8. The public preview remains static; actual confidential allocations require authentication, access control and organisational authority.

## Source register (initial)

- WTL public theme plans: https://www.wetheleader.org/theme-detail?theme=youth-skilling-empowerment
- WTL environmental activity results (organiser-reported): https://www.wetheleader.org/theme-detail
- WTL impact report library: https://www.wetheleader.org/impact
- Tamil Nadu SDG district-localisation programme: https://des.tn.gov.in/en/node/404
- Tamil Nadu statistical handbook and district publications: https://www.des.tn.gov.in/en/node/32

These sources establish availability of data and stated aims, **not** programme impact, resource cost, marginal return, public opinion or electoral prospects.
