# Test Cases — 17 View assigned tickets

| | |
|---|---|
| **Story** | [`stories/17-view-assigned-tickets`](../../../stories/17-view-assigned-tickets/story.md) |
| **Spec** | [`specs/17-view-assigned-tickets`](../../../specs/17-view-assigned-tickets/spec.md) |
| **Area** | Agent Dashboard |
| **Priority** | P2 |
| **Endpoints** | `GET /api/agents/me/tickets?agentId=&status=&priority=` |
| **Implementation** | [`AgentsController.cs`](../../../backend/CrmApi/Controllers/AgentsController.cs) |
| **UI** | [`dashboard.page.ts`](../../../frontend/src/app/pages/dashboard.page.ts) |

## "me" is a query parameter, not an identity

The route reads `/api/agents/me/tickets`, but the agent is resolved from a **required `agentId`
query parameter**. The controller comment states this is a placeholder until authentication
exists. Two consequences shape this file:

- Omitting `agentId` is a `400`, not a fallback to the caller's own identity.
- Any caller can read any agent's queue by changing one value in the URL.

## Ordering

`OrderByDescending(t => t.Priority).ThenBy(t => t.CreatedAt)`. Since `TicketPriority` is declared
`Low, Medium, High, Urgent`, descending puts `Urgent` first; within a band the oldest ticket
leads, so the longest-waiting item is at the top of each priority group.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-17-001 | An agent sees only their own tickets | Positive | P2 | Agent A holds 3 tickets, agent B holds 2 | Agent A's id | 1. `GET /api/agents/me/tickets?agentId={A}`. | `200 OK` with exactly A's 3 tickets. None of B's appear. | Not Run |
| TC-17-002 | Unassigned tickets never appear | Positive | P2 | Agent A holds 2 tickets; 3 tickets are unassigned | Agent A's id | 1. `GET .../me/tickets?agentId={A}`. | Only the 2 assigned tickets are returned. The unassigned pool is invisible from this endpoint and has no route of its own. | Not Run |
| TC-17-003 | The queue is ordered urgent first, then oldest first | Positive | P2 | One agent holding tickets of every priority, created at distinct times | Agent A's id | 1. `GET .../me/tickets?agentId={A}`.<br>2. Read the sequence. | Ordered `Urgent`, `High`, `Medium`, `Low`. Within each band the oldest `createdAt` comes first. | Not Run |
| TC-17-004 | Filter by status | Positive | P2 | The agent holds tickets in several statuses | `?status=Open` | 1. `GET .../me/tickets?agentId={A}&status=Open`. | Only `Open` tickets are returned. | Not Run |
| TC-17-005 | Filter by priority | Positive | P2 | The agent holds tickets of several priorities | `?priority=Urgent` | 1. `GET .../me/tickets?agentId={A}&priority=Urgent`. | Only `Urgent` tickets are returned. | Not Run |
| TC-17-006 | Filters combine | Positive | P2 | Mixed tickets | `?status=Open&priority=High` | 1. `GET` with both filters. | Only tickets satisfying both conditions are returned. | Not Run |
| TC-17-007 | Resolved and closed tickets are included by default | Edge | P2 | The agent holds 2 `Open` and 2 `Closed` tickets | No status filter | 1. `GET .../me/tickets?agentId={A}`. | All 4 are returned. There is no implicit "active only" default, so an agent's queue fills with completed work unless the client filters. Confirm this matches the dashboard's intent. | Not Run |
| TC-17-008 | An agent with no assigned tickets | Edge | P2 | An agent id that owns nothing | An unused UUID | 1. `GET .../me/tickets?agentId={unused}`. | `200 OK` with `[]`. | Not Run |
| TC-17-009 | A missing `agentId` is rejected | Negative | P2 | API running | No query string | 1. `GET /api/agents/me/tickets`. | `400 Bad Request` — `Guid` is non-nullable so binding fails. Confirm it does **not** silently fall back to `Guid.Empty` and return an empty list, which would mask the error. | Not Run |
| TC-17-010 | A malformed `agentId` is rejected | Negative | P2 | API running | `?agentId=not-a-guid` | 1. `GET`. | `400 Bad Request`. | Not Run |
| TC-17-011 | An invalid status or priority filter is rejected | Negative | P2 | API running | `?agentId={A}&status=Archived`, then `&priority=Critical` | 1. `GET` once per case. | `400 Bad Request` each time. | Not Run |
| TC-17-012 | The queue is unbounded | Edge | P3 | An agent holding 500 tickets | Agent A's id | 1. `GET .../me/tickets?agentId={A}`.<br>2. Count the results. | All 500 are returned. Unlike `GET /api/tickets`, which caps at 200, this endpoint applies no limit and no paging, so a busy agent's dashboard load grows without bound. Raise as a performance defect. | Not Run |
| TC-17-013 | Any caller can read any agent's queue | Security | P2 | Two agents with tickets | Agent B's id, supplied by a caller acting as A | 1. `GET .../me/tickets?agentId={B}`. | Currently `200 OK` with B's full queue, including subjects and customer ids. Once auth exists this must be `403 Forbidden` unless the caller is B or a supervisor. Evidence for GAP-23. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-17-001, TC-17-003 | |
| AC-2 Invalid input → 400 | TC-17-009…011 | |
| AC-3 Not found | TC-17-008 | An unknown agent yields an empty list, not `404` |
| AC-4 Authorization → 401/403 | TC-17-013 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-23 | The agent is taken from a query parameter, so any caller can read any agent's queue. |
| GAP-67 | The endpoint applies no result cap or paging, unlike the general ticket list. |
| GAP-68 | There is no route to list unassigned tickets, so no agent can see or pick up the unassigned pool. |
