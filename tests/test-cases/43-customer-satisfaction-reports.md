# Test Cases — 43 Customer satisfaction reports

| | |
|---|---|
| **Story** | [`stories/43-customer-satisfaction-reports`](../../../stories/43-customer-satisfaction-reports/story.md) |
| **Spec** | [`specs/43-customer-satisfaction-reports`](../../../specs/43-customer-satisfaction-reports/spec.md) |
| **Area** | Reports & Management |
| **Priority** | P3 |
| **Endpoints** | `GET /api/reports/csat?dateFrom=&dateTo=` |
| **Implementation** | [`ReportsController.cs`](../../../backend/CrmApi/Controllers/ReportsController.cs) |

## The response is a single object, not a list

```
responseCount   : number of feedback rows in range
averageRating   : mean rating, rounded to 2 decimal places
percentSatisfied: percentage with rating >= 4, rounded to 1 decimal place
```

Unlike the other three reports this one returns one object rather than an array, and it filters
on `SubmittedAt` rather than `CreatedAt` — the only report whose date range means what a reader
would assume.

Feedback is fed only by story 39, which permits **one submission per ticket, after resolution
only**. So the CSAT population is a subset of resolved tickets, never all of them.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-43-001 | Average across several ratings | Positive | P3 | Feedback rows with ratings 5, 4 and 3 | — | 1. `GET /api/reports/csat`. | `responseCount: 3`, `averageRating: 4`, `percentSatisfied: 66.7` — two of the three are 4 or above. | Not Run |
| TC-43-002 | The satisfaction threshold is 4 | Edge | P3 | Ratings 3, 4 and 5 | — | 1. `GET /api/reports/csat`. | `percentSatisfied: 66.7`. A rating of 4 counts as satisfied and 3 does not — the boundary is `>= 4`. Confirm this matches the business definition before publishing the metric. | Not Run |
| TC-43-003 | Average is rounded to two decimal places | Edge | P3 | Ratings 5, 4 and 4 | — | 1. `GET`. | `averageRating: 4.33` — `Math.Round(4.333…, 2)`. Note the two figures use different precision: the average has two decimals, the percentage one. | Not Run |
| TC-43-004 | All ratings identical | Edge | P3 | Five ratings of 5 | — | 1. `GET`. | `responseCount: 5`, `averageRating: 5`, `percentSatisfied: 100`. | Not Run |
| TC-43-005 | All ratings below the threshold | Edge | P3 | Ratings 1, 2 and 3 | — | 1. `GET`. | `averageRating: 2`, `percentSatisfied: 0`. Confirms zero satisfaction is reported as `0`, not omitted. | Not Run |
| TC-43-006 | No feedback returns zeros, not an error | Edge | P3 | `SEED-EMPTY`, or resolved tickets with no feedback | — | 1. `GET /api/reports/csat`. | `{responseCount: 0, averageRating: 0, percentSatisfied: 0}` — the early return prevents a division by zero. Note the ambiguity: `averageRating: 0` is outside the valid 1–5 scale and means "no data", but a chart will plot it as the worst possible score. Raise as a presentation defect — GAP-128. | Not Run |
| TC-43-007 | The date filter applies to submission time | Positive | P3 | Feedback submitted in January and in February | `?dateFrom=2026-02-01&dateTo=2026-02-28` | 1. `GET`. | Only February's submissions are counted. This report filters on `SubmittedAt`, unlike the SLA and agent reports which filter on ticket creation — the only one whose date range means what a reader expects. Verify explicitly. | Not Run |
| TC-43-008 | Both date bounds are inclusive | Edge | P3 | Feedback submitted exactly on each bound | Explicit UTC timestamps | 1. `GET` with both bounds. | Both boundary rows are counted — `>=` and `<=`. | Not Run |
| TC-43-009 | An inverted date range returns zeros | Edge | P3 | Feedback exists | `?dateFrom=2026-03-01&dateTo=2026-01-01` | 1. `GET`. | All three figures are `0`, indistinguishable from "no feedback". The bounds are applied literally with no sanity check. | Not Run |
| TC-43-010 | A malformed date is rejected | Negative | P3 | API running | `?dateFrom=not-a-date` | 1. `GET`. | `400 Bad Request`. | Not Run |
| TC-43-011 | Response rate cannot be derived | Negative | P3 | 100 resolved tickets, 5 with feedback | — | 1. `GET /api/reports/csat`. | `responseCount: 5`. There is no eligible-ticket count, so a reader cannot tell whether the average reflects 5% or 95% of customers. An average of 5.0 from five responses out of a hundred is indistinguishable from universal delight. Raise as a defect — GAP-129. | Not Run |
| TC-43-012 | No breakdown by category, agent or period | Negative | P3 | Feedback spanning several agents and categories | — | 1. `GET /api/reports/csat`.<br>2. Look for any breakdown. | A single global object. The report cannot answer which agent, category or month is driving satisfaction, so a falling score gives no lead to follow. Note that feedback is joined to a ticket in the database, so all of this is derivable but not exposed — GAP-127. | Not Run |
| TC-43-013 | Comments are not surfaced | Negative | P3 | Feedback rows carrying substantial comments | — | 1. `GET /api/reports/csat`. | Only the three numbers are returned. Customers' written feedback is stored and then never shown anywhere in the product — the qualitative half of story 43 is missing. Evidence for GAP-117. | Not Run |
| TC-43-014 | Feedback survives its ticket being reopened | Edge | P3 | A rated ticket that is subsequently reopened | — | 1. Reopen the ticket.<br>2. `GET /api/reports/csat`. | The rating still counts. Feedback is not tied to the ticket's current status, so a score given for a resolution that later proved wrong stays in the average — and story 39 prevents the customer from revising it (GAP-116). | Not Run |
| TC-43-015 | Aggregation happens in memory | Edge | P3 | 100,000 feedback rows | — | 1. `GET` and observe memory and response time. | Every matching row is materialised before averaging. Lower impact than the other reports, since feedback volume is bounded by resolved tickets, but the same pattern — GAP-121. | Not Run |
| TC-43-016 | The report is unauthenticated | Security | P3 | API running | No credentials | 1. `GET /api/reports/csat` with no credentials. | Currently `200 OK`. Anonymous aggregate figures, so the lowest data-exposure risk of the four reports — but satisfaction scores are still commercially sensitive and should be management-only. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-43-001, TC-43-002, TC-43-007 | |
| AC-2 Invalid input → 400 | TC-43-010 | |
| AC-3 Not found | TC-43-006 | Returns zeros rather than `404` |
| AC-4 Authorization → 401/403 | TC-43-016 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-117 | Feedback comments are stored but surfaced nowhere, so qualitative feedback is lost. |
| GAP-121 | Aggregation is performed in memory rather than in SQL. |
| GAP-127 | There is no breakdown by agent, category or period, although the underlying join exists. |
| GAP-128 | With no feedback the average is reported as `0`, a value outside the 1–5 scale that charts will plot as the worst possible score. |
| GAP-129 | No eligible-ticket count is reported, so the response rate cannot be derived and the average cannot be judged. |
