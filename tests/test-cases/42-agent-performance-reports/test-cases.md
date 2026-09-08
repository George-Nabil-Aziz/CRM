# Test Cases — 42 Agent performance reports

| | |
|---|---|
| **Story** | [`stories/42-agent-performance-reports`](../../../stories/42-agent-performance-reports/story.md) |
| **Spec** | [`specs/42-agent-performance-reports`](../../../specs/42-agent-performance-reports/spec.md) |
| **Area** | Reports & Management |
| **Priority** | P3 |
| **Endpoints** | `GET /api/reports/agents?dateFrom=&dateTo=` |
| **Implementation** | [`ReportsController.cs`](../../../backend/CrmApi/Controllers/ReportsController.cs) |

## How each figure is derived

```
population : tickets where AssignedAgentId != null   (filtered by CreatedAt)
grouped by : AssignedAgentId
ticketCount: every ticket in the group, resolved or not
avgHours   : mean of (ResolvedAt - CreatedAt) over resolved tickets only, else 0
agentName  : looked up in Users, or "Unknown agent"
order      : ticketCount descending
```

Note what `avgHours` measures: **creation to resolution**, not assignment to resolution. Time
the ticket spent unassigned, or with a previous agent, is charged to whoever happens to hold it
at report time. Since the report groups on the *current* assignee, reassignment moves a ticket's
entire history onto the new agent.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-42-001 | Ticket counts per agent | Positive | P3 | Agent A holds 5 tickets, agent B holds 3 | — | 1. `GET /api/reports/agents`. | Two entries: A with `ticketCount: 5`, B with `3`, each carrying `agentId` and `agentName`. | Not Run |
| TC-42-002 | Agents are ordered by ticket count descending | Positive | P3 | Three agents holding 2, 7 and 4 tickets | — | 1. `GET /api/reports/agents`.<br>2. Read the order. | The agent with 7 is first, then 4, then 2. | Not Run |
| TC-42-003 | Average resolution time is correct | Positive | P3 | Agent A with two resolved tickets, one taking 2 hours and one taking 4 | — | 1. `GET /api/reports/agents`. | `averageResolutionHours: 3` — the mean of the two, rounded to one decimal place. | Not Run |
| TC-42-004 | Rounding is to one decimal place | Edge | P3 | Agent A with three resolved tickets taking 1, 2 and 2 hours | — | 1. `GET`. | `1.7` — `Math.Round(1.666…, 1)`. | Not Run |
| TC-42-005 | Unresolved tickets are counted but not timed | Edge | P3 | Agent A with 1 resolved ticket taking 2 hours and 4 still open | — | 1. `GET /api/reports/agents`. | `ticketCount: 5` but `averageResolutionHours: 2`. The count covers all assigned work while the average covers only resolved work, so the two figures describe different populations. Document this for report consumers — it is easy to misread. | Not Run |
| TC-42-006 | An agent with no resolved tickets shows zero, not an error | Edge | P3 | Agent A holding 3 tickets, none resolved | — | 1. `GET /api/reports/agents`. | `ticketCount: 3`, `averageResolutionHours: 0`. The guard on `resolved.Count == 0` prevents a division by zero. Note the ambiguity: `0` here means "no data", but it reads like "resolved instantly". Raise as a presentation defect. | Not Run |
| TC-42-007 | Unassigned tickets are excluded | Positive | P3 | 4 assigned tickets and 6 unassigned | — | 1. `GET /api/reports/agents`.<br>2. Sum the ticket counts. | The total is 4. Unassigned work appears in no agent's row and in no total, so the report cannot show the size of the unassigned backlog — pair with GAP-68. | Not Run |
| TC-42-008 | An unknown agent id is labelled rather than dropped | Edge | P3 | A ticket assigned to a UUID matching no user | — | 1. `GET /api/reports/agents`. | An entry appears with `agentName: "Unknown agent"` and the raw id. This is the reporting symptom of GAP-14 — assignment never validates the agent — and it is at least visible rather than silently omitted. | Not Run |
| TC-42-009 | Resolution time is measured from creation, not assignment | Negative | P3 | A ticket created 10 hours ago, assigned to agent A 1 hour ago, and resolved now | — | 1. `GET /api/reports/agents`. | `averageResolutionHours: 10` for agent A, not 1. The nine hours before the ticket reached them are charged to A. An agent picking up an aged backlog is penalised for the wait. Raise as a defect — GAP-125. | Not Run |
| TC-42-010 | Reassignment moves the whole ticket history | Negative | P3 | A ticket handled and resolved by agent A, then reassigned to agent B | — | 1. Reassign the resolved ticket to B.<br>2. `GET /api/reports/agents`. | The ticket now counts entirely toward **B**, and disappears from A's row. Grouping is on the current assignee with no history, so a single reassignment rewrites past performance. Raise as a defect — GAP-126. | Not Run |
| TC-42-011 | A reopened and re-resolved ticket keeps its original duration | Edge | P3 | A ticket resolved after 1 hour, reopened, then resolved again three days later | — | 1. `GET /api/reports/agents`. | The duration is still 1 hour, because `ResolvedAt` is never overwritten. The agent's average understates the real effort — GAP-50 seen from the agent-reporting side. | Not Run |
| TC-42-012 | The date filter applies to creation, not resolution | Edge | P3 | A ticket created in January and resolved in February | `?dateFrom=2026-02-01&dateTo=2026-02-28` | 1. `GET`. | Excluded. A "February agent report" covers tickets *raised* in February, so work completed in February on older tickets is invisible. Same semantics as the SLA report — GAP-124. | Not Run |
| TC-42-013 | Both date bounds are inclusive | Edge | P3 | Tickets created exactly on each bound | Explicit UTC timestamps | 1. `GET` with both bounds. | Both boundary tickets are included. | Not Run |
| TC-42-014 | A malformed date is rejected | Negative | P3 | API running | `?dateFrom=not-a-date` | 1. `GET`. | `400 Bad Request`. | Not Run |
| TC-42-015 | An empty database returns an empty report | Edge | P3 | `SEED-EMPTY` | — | 1. `GET /api/reports/agents`. | `200 OK` with `[]`. | Not Run |
| TC-42-016 | No quality dimension is reported | Negative | P3 | Agents with resolved tickets and submitted feedback | — | 1. `GET /api/reports/agents`.<br>2. Look for a satisfaction or reopen figure. | Only volume and speed are reported. There is no CSAT per agent, no reopen rate and no first-response time, so an agent who closes tickets fast and badly scores best. Feedback exists in the database but is never joined to the agent. Raise as a product gap — GAP-127. | Not Run |
| TC-42-017 | Aggregation happens in memory | Edge | P3 | 100,000 assigned tickets | — | 1. `GET` and observe memory and response time. | Every matching row is materialised before grouping. Same defect as the other reports — GAP-121. | Not Run |
| TC-42-018 | The report is unauthenticated | Security | P3 | API running | No credentials | 1. `GET /api/reports/agents` with no credentials. | Currently `200 OK`, returning named individual performance data. This is **personal** data about employees, not an anonymous aggregate — the most sensitive of the four reports and the one that most needs authorisation. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-42-001, TC-42-002, TC-42-003 | |
| AC-2 Invalid input → 400 | TC-42-014 | |
| AC-3 Not found | TC-42-015, TC-42-008 | An unknown agent is labelled, not dropped |
| AC-4 Authorization → 401/403 | TC-42-018 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-50 | A reopened and re-resolved ticket keeps its first resolution time, understating the true duration. |
| GAP-121 | Aggregation is performed in memory rather than in SQL. |
| GAP-124 | The date filter applies to `CreatedAt`, so a period report covers tickets raised in it, not resolved in it. |
| GAP-125 | `averageResolutionHours` measures creation to resolution, so time before assignment is charged to the assignee. |
| GAP-126 | Grouping is on the current assignee with no assignment history, so reassigning a resolved ticket rewrites both agents' past figures. |
| GAP-127 | The report covers volume and speed only. There is no per-agent satisfaction, reopen rate or first-response time, so quality is unmeasured. |
