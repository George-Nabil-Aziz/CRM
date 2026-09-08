# Test Cases — 41 SLA performance reports

| | |
|---|---|
| **Story** | [`stories/41-sla-performance-reports`](../../../stories/41-sla-performance-reports/story.md) |
| **Spec** | [`specs/41-sla-performance-reports`](../../../specs/41-sla-performance-reports/spec.md) |
| **Area** | Reports & Management |
| **Priority** | P3 |
| **Endpoints** | `GET /api/reports/sla?dateFrom=&dateTo=` |
| **Implementation** | [`ReportsController.cs`](../../../backend/CrmApi/Controllers/ReportsController.cs) |

## How compliance is calculated

```
population: tickets where ResolutionTargetAt != null   (filtered by CreatedAt)
grouped by: (Category, Priority)
met       : ResolvedAt != null && ResolvedAt <= ResolutionTargetAt
compliance: round(100 * met / total, 1)
```

Two consequences deserve their own cases:

- **Only the resolution target is measured.** `ResponseTargetAt` is never read, so the "response"
  half of story 22's SLA is absent from the report (GAP-29).
- **Anything not yet resolved counts as not met.** A ticket opened five minutes ago with a
  four-hour target is already in the denominator as a miss, so compliance is understated
  whenever open work is in range.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-41-001 | A ticket resolved before its target counts as met | Positive | P3 | One `Technical`/`High` ticket with an SLA target, resolved an hour before it | — | 1. `GET /api/reports/sla`. | One entry with `category: "Technical"`, `priority: "High"`, `total: 1`, `metTarget: 1`, `compliancePercent: 100`. | Not Run |
| TC-41-002 | A ticket resolved after its target counts as missed | Positive | P3 | One ticket resolved an hour **after** its target | — | 1. `GET /api/reports/sla`. | `total: 1`, `metTarget: 0`, `compliancePercent: 0`. | Not Run |
| TC-41-003 | Resolution exactly at the target counts as met | Edge | P3 | A ticket whose `ResolvedAt` equals `ResolutionTargetAt` to the second | — | 1. `GET /api/reports/sla`. | Counted as met — the comparison is `<=`. Boundary confirmed. | Not Run |
| TC-41-004 | Results are grouped by category and priority together | Positive | P3 | Tickets in `Technical`/`High`, `Technical`/`Low` and `Billing`/`High` | — | 1. `GET /api/reports/sla`.<br>2. Count the entries. | Three separate entries — the grouping key is the pair, matching how SLA rules themselves are defined. | Not Run |
| TC-41-005 | Compliance is rounded to one decimal place | Edge | P3 | 3 tickets in one group, 2 of them met | — | 1. `GET /api/reports/sla`. | `compliancePercent: 66.7` — `Math.Round(66.666…, 1)`. | Not Run |
| TC-41-006 | Tickets with no SLA target are excluded entirely | Edge | P3 | 2 tickets with targets and 3 without, all in the same category and priority | — | 1. `GET /api/reports/sla`.<br>2. Read `total`. | `total: 2`. Tickets outside SLA rule coverage are absent from both the numerator and the denominator, so they neither help nor hurt compliance. Correct, but it means the report is silent about unmonitored work — pair with GAP-77. | Not Run |
| TC-41-007 | An unresolved ticket still inside its target counts as a miss | Negative | P3 | One `Open` ticket created 5 minutes ago with a 4-hour target, and nothing else | — | 1. `GET /api/reports/sla`. | `total: 1`, `metTarget: 0`, `compliancePercent: 0` — even though the ticket has plenty of time left. Live open work drags reported compliance toward zero, so the figure is not trustworthy for any period containing open tickets. Raise as a defect — GAP-123. | Not Run |
| TC-41-008 | A ticket closed without ever being resolved counts as a miss | Edge | P3 | A `Closed` ticket whose `ResolvedAt` is null, with a target in the past | — | 1. `GET /api/reports/sla`. | Counted as a miss. `ResolvedAt` is only stamped on the transition into `Resolved`, so a ticket closed by another route has no resolution time. Confirm the transition table makes this unreachable in practice. | Not Run |
| TC-41-009 | A reopened and re-resolved ticket is measured on its first resolution | Edge | P3 | A ticket resolved on time, reopened, then resolved again long after its target | — | 1. `GET /api/reports/sla`. | Counted as **met**, because `ResolvedAt` retains the first resolution and is never overwritten. A ticket that in reality took days is reported as compliant. Raise as a defect — GAP-50 seen from the reporting side. | Not Run |
| TC-41-010 | Escalated tickets are not distinguished | Edge | P3 | One breached, auto-escalated ticket and one plainly late ticket | — | 1. `GET /api/reports/sla`. | Both are simply misses. The report never reads the `escalated` flag, so it cannot show how many breaches triggered escalation — which is the actual subject of story 24. | Not Run |
| TC-41-011 | The date filter applies to creation, not resolution | Edge | P3 | A ticket created in January and resolved in February | `?dateFrom=2026-02-01&dateTo=2026-02-28` | 1. `GET`. | The ticket is **excluded**, because the filter is on `CreatedAt`. A "February SLA report" therefore covers tickets *raised* in February, not those *resolved* in February — a meaningful difference that report consumers must understand. Document it. | Not Run |
| TC-41-012 | Both date bounds are inclusive | Edge | P3 | Tickets created exactly on each bound | Explicit UTC timestamps | 1. `GET` with both bounds. | Both boundary tickets are included — `>=` and `<=`. | Not Run |
| TC-41-013 | A malformed date is rejected | Negative | P3 | API running | `?dateFrom=not-a-date` | 1. `GET`. | `400 Bad Request`. | Not Run |
| TC-41-014 | An empty database returns an empty report | Edge | P3 | `SEED-EMPTY` | — | 1. `GET /api/reports/sla`. | `200 OK` with `[]` — no rows, no division by zero. | Not Run |
| TC-41-015 | No tickets have SLA targets | Edge | P3 | Tickets exist but no SLA rules were ever configured | — | 1. `GET /api/reports/sla`. | `[]`. The report is empty rather than reporting 0% across the board, which correctly distinguishes "nothing measured" from "everything missed". Record as verified. | Not Run |
| TC-41-016 | The response target is absent from the report | Negative | P3 | Tickets with both targets set, some past their response target | — | 1. `GET /api/reports/sla`.<br>2. Look for any response-time figure. | There is none. `SlaPerformanceEntry` carries only resolution compliance, so first-response performance — the metric most helpdesks report on — cannot be produced at all. Evidence for GAP-29. | Not Run |
| TC-41-017 | Aggregation happens in memory | Edge | P3 | 100,000 tickets with SLA targets | — | 1. `GET` and observe memory and response time. | Every matching row is materialised before grouping. Same defect as the ticket report — GAP-121. | Not Run |
| TC-41-018 | The report is unauthenticated | Security | P3 | API running | No credentials | 1. `GET /api/reports/sla` with no credentials. | Currently `200 OK`. SLA compliance is a contractual metric that should be management-only. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-41-001, TC-41-002, TC-41-004 | |
| AC-2 Invalid input → 400 | TC-41-013 | |
| AC-3 Not found | TC-41-014, TC-41-015 | An empty result returns `[]` |
| AC-4 Authorization → 401/403 | TC-41-018 | Blocked, GAP-01 |
| Data field `actualResponseAt` | TC-41-016 | Not reported — GAP-29 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-29 | Response-target performance is not reported, because the target is never enforced or measured. |
| GAP-50 | `ResolvedAt` retains the first resolution, so a reopened ticket resolved late is still reported as compliant. |
| GAP-121 | Aggregation is performed in memory rather than in SQL. |
| GAP-123 | Unresolved tickets still inside their target are counted as misses, understating compliance for any period containing open work. |
| GAP-124 | The date filter applies to `CreatedAt`, so an SLA report for a period covers tickets raised in it, not resolved in it. |
