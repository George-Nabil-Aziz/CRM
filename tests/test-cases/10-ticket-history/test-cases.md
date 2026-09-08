# Test Cases — 10 View ticket history

| | |
|---|---|
| **Story** | [`stories/10-ticket-history`](../../../stories/10-ticket-history/story.md) |
| **Spec** | [`specs/10-ticket-history`](../../../specs/10-ticket-history/spec.md) |
| **Area** | Ticket Management |
| **Priority** | P1 |
| **Endpoints** | `GET /api/tickets/{id}/history` |
| **Implementation** | [`TicketsController.cs`](../../../backend/CrmApi/Controllers/TicketsController.cs) |
| **UI** | [`ticket-detail.page.ts`](../../../frontend/src/app/pages/ticket-detail.page.ts) |

## What actually reaches the history

`TicketEventType` declares five values. Only three are ever written.

| Event type | Written by | Text |
|---|---|---|
| `Assignment` | Manual assign | `Assigned to agent <uuid>.` |
| `Assignment` | Auto-assign rule | `Auto-assigned to agent <uuid> by rule <rule-id>.` |
| `StatusChange` | Status update | `Status changed from 'X' to 'Y'.` |
| `Escalation` | Manual escalate | `Escalated: <reason>` |
| `Escalation` | SLA monitor | `Auto-escalated: SLA resolution target breached.` |
| `Message` | **Nothing** | — |
| `Note` | **Nothing** | — |

Ordering is by `timestamp` **ascending** — the opposite of the customer history endpoint,
which is descending. `actorId` is on the response contract but no code path ever sets it.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-10-001 | History is returned oldest first | Positive | P1 | A ticket that has been assigned, moved and escalated at distinct times | — | 1. `GET /api/tickets/{id}/history`. | `200 OK` with events ordered by `timestamp` ascending. Note the convention differs from `GET /api/customers/{id}/history`, which is descending — a UI showing both must not assume one order. | Not Run |
| TC-10-002 | Assignment, status change and escalation all appear | Positive | P1 | A fresh ticket | — | 1. Assign it, change its status, then escalate it.<br>2. `GET .../history`. | Three events in the order the actions were performed, of types `Assignment`, `StatusChange` and `Escalation`. | Not Run |
| TC-10-003 | Messages and internal notes never appear | Negative | P1 | A ticket with an inbound email and an internal note | — | 1. Send an inbound message and post an internal note.<br>2. `GET .../history`. | Neither appears. `TicketEventType.Message` and `TicketEventType.Note` are declared but no code writes them, so the conversation and the team's collaboration are invisible in history. **This case is expected to fail against story 10's intent** — evidence for GAP-17. | Not Run |
| TC-10-004 | Event details are human-readable | Positive | P1 | A ticket with all three event types | — | 1. `GET .../history`.<br>2. Read each `details` string. | Each reads as a sentence: `Assigned to agent <uuid>.`, `Status changed from 'Open' to 'Pending'.`, `Escalated: <reason>`. Nothing is a raw code or an empty string. | Not Run |
| TC-10-005 | Manual and automatic actions are distinguishable | Positive | P2 | One auto-assigned ticket and one manually assigned ticket | — | 1. `GET .../history` for each. | The auto-assigned ticket reads `Auto-assigned to agent … by rule …`; the manual one reads `Assigned to agent …`. The wording is the only signal — there is no source field. | Not Run |
| TC-10-006 | A brand-new ticket has an empty history | Edge | P2 | A ticket created with no automation rules configured | — | 1. `GET .../history` immediately after creation. | `200 OK` with `[]`. Creation alone writes no event, so a ticket's own creation is absent from its history. Confirm whether a `Created` event should exist. | Not Run |
| TC-10-007 | An auto-assigned ticket starts with one event | Edge | P2 | An assignment rule matching the ticket's category | — | 1. Create a ticket.<br>2. `GET .../history`. | Exactly one `Assignment` event reading `Auto-assigned to agent <id> by rule <rule-id>.` | Not Run |
| TC-10-008 | A no-op status update adds nothing | Edge | P2 | An `Open` ticket | `{"status":"Open"}` | 1. `PATCH .../status` to the same status.<br>2. `GET .../history`. | The history is unchanged — the equality short-circuit runs before any event is written. | Not Run |
| TC-10-009 | A rejected transition adds nothing | Edge | P2 | An `Open` ticket | `{"status":"Closed"}` | 1. Attempt the illegal transition.<br>2. `GET .../history`. | The history is unchanged. Failed attempts leave no trace, so repeated invalid attempts by an agent are not visible to a supervisor. | Not Run |
| TC-10-010 | Category and priority changes are absent | Negative | P2 | An existing ticket | `{"category":"Billing","priority":"Urgent"}` | 1. `PATCH /api/tickets/{id}`.<br>2. `GET .../history`. | No event appears. Re-categorisation and reprioritisation are unaudited — evidence for GAP-15. | Not Run |
| TC-10-011 | Events never identify the actor | Negative | P2 | A ticket with several events | — | 1. `GET .../history`.<br>2. Inspect `actorId` on every entry. | `actorId` is `null` throughout. Spec 10 marks it required, but no code path sets it — and with no auth layer there is no identity to record. **This case is expected to fail against the spec** — evidence for GAP-13. | Not Run |
| TC-10-012 | History for a non-existent ticket | Negative | P2 | API running | A random UUID | 1. `GET /api/tickets/{random-uuid}/history`. | `404 Not Found`. | Not Run |
| TC-10-013 | History is immutable through the API | Security | P2 | A ticket with events | — | 1. Look for any route that edits or deletes a ticket event. | There is none — `GET` is the only history route. This is correct for an audit trail; record it as verified rather than as a gap. | Not Run |
| TC-10-014 | History is unbounded | Edge | P3 | A ticket with 1,000 events | — | 1. `GET .../history`. | All 1,000 are returned. There is no limit and no paging, though a single ticket is unlikely to reach a problematic size in practice. | Not Run |
| TC-10-015 | Unauthorized caller cannot read history | Security | P1 | Auth layer deployed | No credentials | 1. `GET .../history` with no `Authorization` header. | `401 Unauthorized`. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-10-001, TC-10-002, TC-10-004 | |
| AC-2 Invalid input → 400 | — | No request body or query parameters exist to invalidate |
| AC-3 Not found | TC-10-012 | |
| AC-4 Authorization → 401/403 | TC-10-015 | Blocked, GAP-01 |
| Data field `actorId` | TC-10-011 | Expected to fail — GAP-13 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-13 | `TicketEvent.ActorId` is never populated, so no history entry can be attributed to a person. |
| GAP-15 | Category and priority changes write no history event. |
| GAP-17 | `TicketEventType.Message` and `TicketEventType.Note` are declared but never written. |
| GAP-56 | Ticket creation itself produces no history event, so a ticket's timeline does not start at its beginning. |
| GAP-57 | Ticket history is ascending while customer history is descending — an inconsistent convention across two endpoints of the same product. |
