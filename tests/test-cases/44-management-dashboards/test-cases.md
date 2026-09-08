# Test Cases — 44 Management dashboards

| | |
|---|---|
| **Story** | [`stories/44-management-dashboards`](../../../stories/44-management-dashboards/story.md) |
| **Spec** | [`specs/44-management-dashboards`](../../../specs/44-management-dashboards/spec.md) |
| **Area** | Reports & Management |
| **Priority** | P3 |
| **Endpoints** | `GET /api/reports/dashboard?dateFrom=&dateTo=` |
| **Implementation** | [`ReportsController.cs`](../../../backend/CrmApi/Controllers/ReportsController.cs) |
| **UI** | [`dashboard.page.ts`](../../../frontend/src/app/pages/dashboard.page.ts) |

## The dashboard is the other four reports in one envelope

```
DashboardResponse(
  TicketsByStatus  = BuildTicketReportAsync(from, to, "status"),
  SlaPerformance   = BuildSlaPerformanceAsync(from, to),
  AgentPerformance = BuildAgentPerformanceAsync(from, to),
  Csat             = BuildCsatAsync(from, to))
```

It calls the same four private builders the individual report endpoints use, with the same date
range, and the ticket grouping is hard-coded to `"status"`. So **every finding from stories
40–43 applies here unchanged** — this file verifies composition, consistency and the whole-object
behaviour rather than re-testing each metric.

One consequence worth stating plainly: the four builders run sequentially against the same
`DbContext`, and the CSAT section filters on a different date column from the other three.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-44-001 | The dashboard returns all four sections | Positive | P3 | `SEED-BASE` with SLA rules, assigned tickets and feedback | — | 1. `GET /api/reports/dashboard`. | `200 OK` with `ticketsByStatus`, `slaPerformance`, `agentPerformance` and `csat` all present. The first three are arrays; `csat` is a single object. | Not Run |
| TC-44-002 | Each section matches its standalone endpoint | Positive | P3 | A stable dataset | — | 1. `GET /api/reports/dashboard`.<br>2. `GET /api/reports/tickets`, `/sla`, `/agents` and `/csat`.<br>3. Compare each section with its endpoint. | Identical content in every case — the dashboard adds no logic of its own. This is the central assertion of the story. | Not Run |
| TC-44-003 | Ticket grouping is always by status | Edge | P3 | Tickets across several categories and statuses | `?groupBy=category` appended to the dashboard URL | 1. `GET /api/reports/dashboard?groupBy=category`. | `ticketsByStatus` is grouped by **status** regardless. The dashboard hard-codes `"status"` and the action does not accept a `groupBy` parameter, so the query string is ignored. Consistent with the field name — record as verified. | Not Run |
| TC-44-004 | The date range applies to every section | Positive | P3 | Data spread across January and February | `?dateFrom=2026-02-01&dateTo=2026-02-28` | 1. `GET` with the range.<br>2. Compare each section with the same range on its standalone endpoint. | All four sections respect the range and match their standalone equivalents. | Not Run |
| TC-44-005 | The date range means different things in different sections | Negative | P3 | A ticket created in January, resolved in February, with feedback submitted in February | `?dateFrom=2026-02-01&dateTo=2026-02-28` | 1. `GET`.<br>2. Compare which sections include the ticket. | The ticket is **absent** from `ticketsByStatus`, `slaPerformance` and `agentPerformance`, which filter on `CreatedAt`, but its rating **is** counted in `csat`, which filters on `SubmittedAt`. One dashboard therefore shows a satisfaction score for work that appears in none of its other panels. Raise as a defect — GAP-130. | Not Run |
| TC-44-006 | An empty database returns a well-formed empty dashboard | Edge | P3 | `SEED-EMPTY` | — | 1. `GET /api/reports/dashboard`. | `200 OK` with three empty arrays and a `csat` object of zeros. No `null` sections and no error — the UI must render this first-run state cleanly. | Not Run |
| TC-44-007 | Sections are independently empty | Edge | P3 | Tickets exist but no SLA rules, no assignments and no feedback | — | 1. `GET`. | `ticketsByStatus` is populated while `slaPerformance` and `agentPerformance` are `[]` and `csat` is zeros. Each section empties on its own terms — a partially configured system produces a partially populated dashboard rather than failing. | Not Run |
| TC-44-008 | A malformed date is rejected | Negative | P3 | API running | `?dateFrom=not-a-date` | 1. `GET`. | `400 Bad Request` before any section is built. | Not Run |
| TC-44-009 | An inverted date range returns an empty dashboard | Edge | P3 | Data exists | `?dateFrom=2026-03-01&dateTo=2026-01-01` | 1. `GET`. | Empty arrays and zeroed CSAT, with no error. | Not Run |
| TC-44-010 | Sections are internally consistent | Positive | P3 | A dataset where every ticket is assigned and has SLA targets | — | 1. `GET`.<br>2. Sum `ticketsByStatus` counts, `slaPerformance` totals and `agentPerformance` counts. | All three sums agree. Where they disagree the cause must be explainable — unassigned tickets are missing from `agentPerformance`, and tickets without SLA targets are missing from `slaPerformance`. Verify the difference matches those two populations exactly rather than indicating a bug. | Not Run |
| TC-44-011 | The dashboard is not a point-in-time snapshot | Edge | P3 | A dataset being modified concurrently | — | 1. Begin a `GET`.<br>2. While it runs, create and resolve tickets. | The four builders execute sequentially in separate queries with no transaction or snapshot isolation, so a busy system can produce a dashboard whose sections disagree with each other. Low practical impact, but assert that the response is still well-formed. | Not Run |
| TC-44-012 | The dashboard costs four full aggregations | Edge | P3 | 100,000 tickets and 20,000 feedback rows | — | 1. `GET` and measure response time and memory. | Four in-memory aggregations run back to back, each materialising its whole population — the cost of GAP-121 multiplied by four, on the single endpoint most likely to be polled by a live dashboard. Raise as the highest-priority instance of that defect. | Not Run |
| TC-44-013 | The dashboard is served without caching | Edge | P3 | A stable dataset | — | 1. `GET` twice and compare responses and timings.<br>2. Inspect the response headers. | Identical content, similar timing, and no cache headers. Every refresh re-runs everything. Combined with TC-44-012 this makes an auto-refreshing UI expensive — check what interval `dashboard.page.ts` uses. | Not Run |
| TC-44-014 | The UI renders every section | Positive | P3 | `SEED-BASE` with data in all four sections | — | 1. Open the dashboard page in the browser.<br>2. Compare the rendered tables with the API response. | All four sections appear and their figures match the API. The page shows three tables plus a link to the ticket list — confirm nothing in the response is silently dropped by the UI. | Not Run |
| TC-44-015 | The dashboard exposes personal agent data unauthenticated | Security | P3 | API running | No credentials | 1. `GET /api/reports/dashboard` with no `Authorization` header. | Currently `200 OK`, returning named per-agent performance alongside every other business metric. This single unauthenticated call yields the most sensitive payload in the API — it inherits the exposure of story 42 and adds the rest. Highest-priority instance of GAP-01 in the reporting area. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-44-001, TC-44-002, TC-44-004 | |
| AC-2 Invalid input → 400 | TC-44-008 | |
| AC-3 Not found | TC-44-006, TC-44-007 | Empty sections rather than `404` |
| AC-4 Authorization → 401/403 | TC-44-015 | Blocked, GAP-01 |

## Inherited findings

Every finding from stories 40–43 applies to this endpoint, because it reuses their builders:
GAP-121 (in-memory aggregation), GAP-122, GAP-123, GAP-124, GAP-125, GAP-126, GAP-127,
GAP-128 and GAP-129. GAP-120 does not apply, since the grouping is hard-coded rather than
taken from the caller.

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-130 | The date range filters three sections on `CreatedAt` and the CSAT section on `SubmittedAt`, so one dashboard can report satisfaction for work absent from every other panel. |
| GAP-131 | The four aggregations run sequentially with no transaction, so sections of a single dashboard can reflect different moments in time. |
