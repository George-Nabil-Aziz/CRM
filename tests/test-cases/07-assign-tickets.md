# Test Cases — 07 Assign tickets to agents

| | |
|---|---|
| **Story** | [`stories/07-assign-tickets`](../../../stories/07-assign-tickets/story.md) |
| **Spec** | [`specs/07-assign-tickets`](../../../specs/07-assign-tickets/spec.md) |
| **Area** | Ticket Management |
| **Priority** | P1 |
| **Endpoints** | `POST /api/tickets/{id}/assign` |
| **Implementation** | [`TicketsController.cs`](../../../backend/CrmApi/Controllers/TicketsController.cs) |
| **UI** | [`ticket-detail.page.ts`](../../../frontend/src/app/pages/ticket-detail.page.ts) — a free-text GUID field |

## Two ways a ticket gets assigned

| Path | Trigger | History event text |
|---|---|---|
| Manual — this story | `POST /api/tickets/{id}/assign` | `Assigned to agent <uuid>.` |
| Automatic — story 23 | A matching assignment rule at creation | `Auto-assigned to agent <uuid> by rule <rule-id>.` |

The two wordings are the only way to tell them apart in history, so several cases below
assert on the exact text.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-07-001 | Assign an unassigned ticket | Positive | P1 | An unassigned ticket; an agent user exists | `{"agentId":"<agent-uuid>"}` | 1. `POST /api/tickets/{id}/assign`.<br>2. Inspect the response. | `200 OK` with `assignedAgentId` set to the supplied id. | Not Run |
| TC-07-002 | Assignment writes a history event | Positive | P1 | TC-07-001 has passed | — | 1. `GET /api/tickets/{id}/history`. | An `Assignment` event exists whose `details` read exactly `Assigned to agent <uuid>.` | Not Run |
| TC-07-003 | Re-assigning replaces the previous assignee | Positive | P1 | A ticket assigned to agent A | Agent B's id | 1. `POST .../assign` with agent B.<br>2. Read the ticket and its history. | `200 OK`, `assignedAgentId` is now B, and history holds two `Assignment` events in chronological order — the trail of who held the ticket is preserved. | Not Run |
| TC-07-004 | Re-assigning to the same agent still writes an event | Edge | P2 | A ticket already assigned to agent A | Agent A's id again | 1. `POST .../assign` with A.<br>2. Count `Assignment` events. | `200 OK` and a **second** identical event is written. Unlike the status endpoint, there is no equality short-circuit, so repeated clicks pad the history. Minor, but note it. | Not Run |
| TC-07-005 | Missing agent id is rejected | Negative | P1 | An existing ticket | `{}` | 1. `POST .../assign` with no `agentId`. | `400 Bad Request` naming `AgentId` — an omitted `Guid` binds to `Guid.Empty` and fails `[Required]`. | Not Run |
| TC-07-006 | A malformed agent id is rejected | Negative | P1 | An existing ticket | `{"agentId":"not-a-guid"}` | 1. `POST .../assign`. | `400 Bad Request` — deserialisation fails before the controller runs. | Not Run |
| TC-07-007 | Assign a ticket that does not exist | Negative | P1 | API running | A random UUID in the path | 1. `POST /api/tickets/{random-uuid}/assign`. | `404 Not Found`. | Not Run |
| TC-07-008 | Assignment to a non-existent agent is accepted | Negative | P2 | An existing ticket | A random UUID as `agentId` | 1. `POST .../assign` with an id matching no user.<br>2. Re-read the ticket. | Currently `200 OK` and the ticket is assigned to nobody real. The controller never checks the agent exists, unlike ticket creation which does check the customer. The ticket then disappears from every real agent's queue. Raise as a defect — GAP-14. | Not Run |
| TC-07-009 | A ticket can be assigned to a customer's id | Negative | P3 | An existing ticket and an existing customer | The customer's id as `agentId` | 1. `POST .../assign` with a customer id. | `200 OK`. Any UUID is accepted, so nothing prevents assigning a ticket to a customer or to a role. This follows from GAP-14 and widens its impact. | Not Run |
| TC-07-010 | A ticket cannot be unassigned | Negative | P2 | An assigned ticket | `{"agentId":null}`, then an empty GUID | 1. Attempt to clear the assignee. | Neither works — null fails `[Required]` and `Guid.Empty` is rejected too. Once assigned, a ticket can only be handed to someone else, never returned to the unassigned pool. Evidence for GAP-47. | Not Run |
| TC-07-011 | Assignment does not notify the new assignee | Negative | P2 | An unassigned ticket; agent A | Agent A's id | 1. `POST .../assign` to agent A.<br>2. `GET /api/notifications?userId={A}`. | No notification is created, although `NotificationType.Assignment` exists in the enum. An agent learns about new work only by refreshing their queue. Evidence for GAP-48. | Not Run |
| TC-07-012 | Assignment fires no webhook | Edge | P3 | Webhooks subscribed to every known event | — | 1. Assign a ticket.<br>2. Inspect the listener. | Nothing is dispatched. Creation, status change and escalation all fire webhooks; assignment does not. Flag the inconsistency to integration consumers. | Not Run |
| TC-07-013 | Unauthorized caller cannot assign | Security | P1 | Auth layer deployed | No credentials | 1. `POST .../assign` with no `Authorization` header. | `401 Unauthorized` and no change persisted. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-07-001, TC-07-002, TC-07-003 | |
| AC-2 Invalid input → 400 | TC-07-005, TC-07-006 | |
| AC-3 Not found | TC-07-007 | TC-07-008 shows the agent side is unchecked |
| AC-4 Authorization → 401/403 | TC-07-013 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-14 | `agentId` is never validated against the users table, so a ticket can be assigned to an id that matches nobody. |
| GAP-47 | There is no way to unassign a ticket once it has an assignee. |
| GAP-48 | Assignment raises no notification for the new assignee, despite `NotificationType.Assignment` existing. |
| GAP-49 | Assignment dispatches no webhook, unlike creation, status change and escalation. |
