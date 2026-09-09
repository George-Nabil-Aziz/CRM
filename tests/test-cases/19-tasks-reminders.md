# Test Cases — 19 Manage tasks and reminders

| | |
|---|---|
| **Story** | [`stories/19-tasks-reminders`](../../../stories/19-tasks-reminders/story.md) |
| **Spec** | [`specs/19-tasks-reminders`](../../../specs/19-tasks-reminders/spec.md) |
| **Area** | Agent Dashboard |
| **Priority** | P2 |
| **Endpoints** | `POST /api/tickets/{id}/reminders` — **the only one** |
| **Implementation** | [`TicketExtrasController.cs`](../../../backend/CrmApi/Controllers/TicketExtrasController.cs) |

## The story says "manage"; only "create" exists

A `Reminder` row carries a `Dismissed` flag and a `DueAt` time, and `NotificationType.Reminder`
is declared in the enum. None of it is reachable.

| Capability | Route | Present |
|---|---|---|
| Create a reminder | `POST /api/tickets/{id}/reminders` | Yes |
| List my reminders | — | **No** |
| List a ticket's reminders | — | **No** |
| Dismiss a reminder | — | **No**, despite the `Dismissed` column |
| Delete a reminder | — | **No** |
| Be notified when one is due | — | **No** — nothing reads `DueAt`; `SlaMonitorService` only looks at SLA targets |

A reminder is therefore write-only: it can be created and then never seen again. Most cases
below verify creation carefully and then record precisely what cannot be done.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-19-001 | Create a reminder on a ticket | Positive | P2 | An existing ticket and an agent id | `{"agentId":"<uuid>","dueAt":"2026-12-01T09:00:00Z","note":"Chase the supplier"}` | 1. `POST /api/tickets/{id}/reminders`.<br>2. Inspect the response. | `201 Created` with a generated `id`, the matching `ticketId`, the submitted `agentId`, `dueAt` and `note`, and `dismissed: false`. | Not Run |
| TC-19-002 | The due time round-trips as UTC | Positive | P2 | An existing ticket | `"dueAt":"2026-12-01T09:00:00Z"` | 1. `POST`.<br>2. Compare the returned `dueAt` with what was sent. | The value returns as the same instant. Repeat with an offset such as `2026-12-01T11:00:00+02:00` and confirm it is stored as the equivalent UTC time rather than losing the offset. | Not Run |
| TC-19-003 | A missing note is rejected | Negative | P2 | An existing ticket | `agentId` and `dueAt` only | 1. `POST`. | `400 Bad Request` naming `Note`. | Not Run |
| TC-19-004 | A missing agent id is rejected | Negative | P2 | An existing ticket | `dueAt` and `note` only | 1. `POST`. | `400 Bad Request` naming `AgentId`. | Not Run |
| TC-19-005 | A missing due time is rejected | Negative | P2 | An existing ticket | `agentId` and `note` only | 1. `POST`. | `400 Bad Request` naming `DueAt` — `DateTime` is non-nullable and marked `[Required]`. | Not Run |
| TC-19-006 | An empty note is rejected | Negative | P2 | An existing ticket | `{"note":""}` plus valid fields | 1. `POST`. | `400 Bad Request` naming `Note`. | Not Run |
| TC-19-007 | A reminder on a non-existent ticket | Negative | P2 | API running | A random UUID in the path | 1. `POST /api/tickets/{random-uuid}/reminders`. | `404 Not Found`. | Not Run |
| TC-19-008 | A due time in the past is accepted | Edge | P3 | An existing ticket | `"dueAt"` set to yesterday | 1. `POST`. | `201 Created` — there is no future-date validation. Since nothing ever reads `DueAt`, the reminder neither fires nor warns. Decide whether a past date should be rejected. | Not Run |
| TC-19-009 | The agent id is never validated | Negative | P3 | An existing ticket | A random UUID as `agentId` | 1. `POST`. | `201 Created`. The id is not checked against the users table, the same weakness as ticket assignment — GAP-14. The reminder belongs to nobody. | Not Run |
| TC-19-010 | Reminders cannot be read back | Negative | P2 | TC-19-001 has passed | — | 1. Search the API for any route returning reminders. | There is none. `POST` is the only reminder route, and reminders appear in neither ticket history nor the ticket context response. An agent cannot see the reminder they just set. Evidence for GAP-25. | Not Run |
| TC-19-011 | Reminders cannot be dismissed | Negative | P2 | TC-19-001 has passed | — | 1. Look for a dismiss or update route. | There is none, although the `Reminder` model carries a `Dismissed` boolean and the response exposes it. The flag is permanently `false`. Follows from GAP-25. | Not Run |
| TC-19-012 | A due reminder produces no notification | Negative | P2 | A reminder whose `dueAt` has passed; the agent has other notifications | — | 1. Let the due time pass, or back-date it.<br>2. Wait for at least one `SlaMonitorService` tick.<br>3. `GET /api/notifications?userId={agentId}`. | No `Reminder` notification appears. `NotificationType.Reminder` is declared but nothing writes it, and the monitor reads only SLA targets. The reminder is silent — the feature does not function. Evidence for GAP-25. | Not Run |
| TC-19-013 | The `Location` header points at the ticket context | Edge | P3 | An existing ticket | A valid reminder payload | 1. `POST`.<br>2. Follow the `Location` header. | It resolves to `GET /api/tickets/{id}/context`, which returns `200` but contains no reminder. The created resource is not addressable — a weaker version of the article `Location` problem in story 29. | Not Run |
| TC-19-014 | Unauthorized caller cannot create a reminder | Security | P2 | Auth layer deployed | No credentials | 1. `POST` with no `Authorization` header. | `401 Unauthorized`. Until then any caller can create reminders on any ticket for any agent id. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-19-001, TC-19-002 | Creation only — the rest of "manage" is unimplemented |
| AC-2 Invalid input → 400 | TC-19-003…006 | |
| AC-3 Not found | TC-19-007 | |
| AC-4 Authorization → 401/403 | TC-19-014 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-14 | `agentId` is not validated against the users table. |
| GAP-25 | Reminders are write-only: no list, no dismiss, no delete, and no notification when one falls due. `Dismissed` and `NotificationType.Reminder` are declared but unreachable, so story 19 is not functional. |
