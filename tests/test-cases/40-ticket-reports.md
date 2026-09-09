# Test Cases — 40 Ticket reports

| | |
|---|---|
| **Story** | [`stories/40-ticket-reports`](../../../stories/40-ticket-reports/story.md) |
| **Spec** | [`specs/40-ticket-reports`](../../../specs/40-ticket-reports/spec.md) |
| **Area** | Reports & Management |
| **Priority** | P3 |
| **Endpoints** | `GET /api/reports/tickets?groupBy=&dateFrom=&dateTo=` |
| **Implementation** | [`ReportsController.cs`](../../../backend/CrmApi/Controllers/ReportsController.cs) |

## Only three groupings exist, and the fourth fails silently

```
groupBy.ToLowerInvariant() switch {
  "category" => group by Category,
  "date"     => group by CreatedAt.Date,
  _          => group by Status          // the default arm
}
```

`groupBy` defaults to `"status"`. Any **unrecognised** value — including `"priority"` — lands on
the `_` arm and is grouped by status with no error. A caller asking for a priority breakdown
receives a status breakdown and has no way to tell, because the response carries only
`{ group, count }` with no echo of the grouping applied.

Date filtering is on `CreatedAt` and both bounds are inclusive.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-40-001 | Default grouping is by status | Positive | P3 | 10 tickets spread across all four statuses | No query string | 1. `GET /api/reports/tickets`. | `200 OK` with one entry per status present, each `{group, count}`. The counts sum to 10. | Not Run |
| TC-40-002 | Group by category | Positive | P3 | Tickets in three categories | `?groupBy=category` | 1. `GET /api/reports/tickets?groupBy=category`. | One entry per category present, with the category name as `group`. | Not Run |
| TC-40-003 | Group by date | Positive | P3 | Tickets created on three distinct days | `?groupBy=date` | 1. `GET /api/reports/tickets?groupBy=date`. | One entry per day, with `group` formatted `yyyy-MM-dd`. Note the grouping is on the **UTC** date, so tickets near midnight fall on the UTC day, not the viewer's local day. | Not Run |
| TC-40-004 | The grouping value is case-insensitive | Edge | P3 | Tickets in several categories | `?groupBy=CATEGORY` | 1. `GET`. | Grouped by category — the switch lower-cases its input first. | Not Run |
| TC-40-005 | Grouping by priority is silently ignored | Negative | P3 | Tickets of several priorities **and** several statuses, arranged so the two breakdowns differ | `?groupBy=priority` | 1. `GET /api/reports/tickets?groupBy=priority`.<br>2. Compare with `?groupBy=status`. | **The two responses are identical.** `priority` is not a supported grouping and falls to the default status arm. A manager asking for a priority breakdown silently receives status data. This is the most damaging defect in the reporting area — raise as GAP-120. | Not Run |
| TC-40-006 | An unrecognised grouping is silently ignored | Negative | P3 | Any tickets | `?groupBy=nonsense` | 1. `GET`. | `200 OK` grouped by status, with no error and no indication that the request was not honoured. It should be `400`, or the response should echo the grouping applied. Same root cause as TC-40-005. | Not Run |
| TC-40-007 | An empty grouping value falls back to status | Edge | P3 | Any tickets | `?groupBy=` | 1. `GET`. | Grouped by status. An empty string reaches the switch and hits the default arm — it does not trip the `= "status"` parameter default, which only applies when the parameter is absent. | Not Run |
| TC-40-008 | Filter by a date range | Positive | P3 | 3 tickets in January and 4 in February | `?dateFrom=2026-02-01&dateTo=2026-02-28` | 1. `GET` with both bounds.<br>2. Sum the counts. | The total is 4 — only February's tickets are counted. | Not Run |
| TC-40-009 | `dateFrom` alone is an open-ended range | Positive | P3 | Tickets before and after a cut-off | `?dateFrom=2026-02-01` | 1. `GET`. | Every ticket created on or after the cut-off is included, with no upper bound. | Not Run |
| TC-40-010 | Both date bounds are inclusive | Edge | P3 | A ticket created at exactly `2026-02-01T00:00:00Z` and another at exactly `2026-02-28T00:00:00Z` | `?dateFrom=2026-02-01T00:00:00Z&dateTo=2026-02-28T00:00:00Z` | 1. `GET`.<br>2. Confirm both are counted. | Both appear — the comparisons are `>=` and `<=`. Note the practical trap: `dateTo=2026-02-28` means midnight, so tickets created **during** 28 February are excluded. Document this for report consumers. | Not Run |
| TC-40-011 | An inverted date range returns nothing | Edge | P3 | Any tickets | `?dateFrom=2026-03-01&dateTo=2026-01-01` | 1. `GET`. | `200 OK` with `[]`. The bounds are applied literally with no sanity check, so an inverted range yields an empty report rather than an error. | Not Run |
| TC-40-012 | A malformed date is rejected | Negative | P3 | API running | `?dateFrom=not-a-date` | 1. `GET`. | `400 Bad Request` — the value cannot bind to `DateTime?`. | Not Run |
| TC-40-013 | An empty database returns an empty report | Edge | P3 | `SEED-EMPTY` | No query string | 1. `GET /api/reports/tickets`. | `200 OK` with `[]` — **not** a list of every status with a count of zero. A dashboard must render an empty array, not assume four rows. Raise as a consumer-facing note. | Not Run |
| TC-40-014 | Statuses with no tickets are omitted | Edge | P3 | Tickets only in `Open` and `Closed` | No query string | 1. `GET`. | Two entries. `Pending` and `Resolved` are absent rather than present with `count: 0`, because grouping only produces keys that exist in the data. A chart must supply the missing categories itself. | Not Run |
| TC-40-015 | Counts total the ticket population | Positive | P3 | 25 tickets, unfiltered | No query string | 1. `GET`.<br>2. Sum every `count`.<br>3. Compare with the true ticket count. | The sum equals 25. Unlike `GET /api/tickets`, the report is **not** capped at 200 — it counts every row. Verify this explicitly, since the two endpoints otherwise look interchangeable. | Not Run |
| TC-40-016 | Grouping happens in memory | Edge | P3 | 100,000 tickets | No query string | 1. `GET` and observe memory and response time. | Every matching ticket row is materialised with `ToListAsync()` before grouping, so memory use scales with the ticket count rather than the group count. The grouping should run in SQL. Raise as a performance defect — GAP-121. | Not Run |
| TC-40-017 | The report is unauthenticated | Security | P3 | API running | No credentials | 1. `GET /api/reports/tickets` with no `Authorization` header. | Currently `200 OK`. Volume and status distribution are business metrics that should be management-only. Aggregate rather than personal data, so lower risk than the portal routes — but still not public. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-40-001, TC-40-002, TC-40-003, TC-40-008 | |
| AC-2 Invalid input → 400 | TC-40-012 | TC-40-005 and TC-40-006 show an invalid `groupBy` is **not** rejected |
| AC-3 Not found | TC-40-013 | An empty result returns `[]` |
| AC-4 Authorization → 401/403 | TC-40-017 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-120 | `groupBy=priority` is unsupported and silently returns a status breakdown. Any unrecognised value does the same, and the response does not echo the grouping applied. |
| GAP-121 | All matching tickets are loaded into memory before grouping instead of aggregating in SQL. |
| GAP-122 | Groups with a zero count are omitted, so consumers must supply missing categories themselves. |
