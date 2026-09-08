# Test Cases — 25 Alerts and notifications

| | |
|---|---|
| **Story** | [`stories/25-alerts-notifications`](../../../stories/25-alerts-notifications/story.md) |
| **Spec** | [`specs/25-alerts-notifications`](../../../specs/25-alerts-notifications/spec.md) |
| **Area** | SLA & Automation |
| **Priority** | P2 |
| **Contract** | `EVENT notification dispatch on SLA threshold` — the writes have no endpoint (GAP-07) |
| **Read endpoints** | `GET /api/notifications?userId=&unreadOnly=`, `POST /api/notifications/{id}/read` |
| **Implementation** | [`SlaMonitorService.cs`](../../../backend/CrmApi/Services/SlaMonitorService.cs), [`TicketExtrasController.cs`](../../../backend/CrmApi/Controllers/TicketExtrasController.cs), [`NotificationsController.cs`](../../../backend/CrmApi/Controllers/NotificationsController.cs) |

## Which notification types are actually produced

`NotificationType` declares five values. Only three are ever written, and one of those comes
from a different story.

| Type | Written by | Reachable |
|---|---|---|
| `SlaBreach` | `SlaMonitorService` on a breach | Yes |
| `SlaWarning` | `SlaMonitorService` within the 15-minute window | Yes |
| `Mention` | Internal notes, story 21 | Yes |
| `Reminder` | **Nothing** | No — GAP-25 |
| `Assignment` | **Nothing** | No — GAP-48 |

There is no delivery channel either: notifications are database rows read by polling. Nothing
sends an email, an SMS or a push, and there is no unread count endpoint.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-25-001 | A breach notifies the assigned agent | Positive | P2 | An `Open` ticket assigned to agent A with a back-dated resolution target | — | 1. Trigger a monitor run.<br>2. `GET /api/notifications?userId={A}`. | One `SlaBreach` notification referencing the ticket, whose message names the ticket number and states it was auto-escalated. | Not Run |
| TC-25-002 | A ticket inside the warning window notifies the agent | Positive | P2 | An `Open` ticket assigned to A whose target is 10 minutes ahead | — | 1. Trigger a run.<br>2. `GET /api/notifications?userId={A}`. | One `SlaWarning` notification reading that the ticket is approaching its deadline. | Not Run |
| TC-25-003 | A ticket outside the window is silent | Edge | P2 | An assigned ticket whose target is 30 minutes ahead | — | 1. Trigger a run. | No notification — the window is the next 15 minutes only. | Not Run |
| TC-25-004 | A ticket exactly at the window edge | Edge | P3 | An assigned ticket whose target is exactly 15 minutes ahead | — | 1. Trigger a run. | A warning **is** written — the comparison is inclusive (`<= now + 15 minutes`). Boundary confirmed. | Not Run |
| TC-25-005 | A warning is sent only once | Edge | P2 | TC-25-002 has passed and the target is still ahead | — | 1. Trigger two further runs.<br>2. Count `SlaWarning` notifications for that ticket. | Still exactly one — each run checks for an existing warning on that ticket before adding another. | Not Run |
| TC-25-006 | A breach after a warning yields both | Positive | P2 | A ticket already warned by TC-25-002 | — | 1. Let the target pass, or back-date it.<br>2. Trigger a run.<br>3. List the agent's notifications. | Two notifications for the ticket: the earlier `SlaWarning` and a new `SlaBreach`. The warning is not superseded or removed. | Not Run |
| TC-25-007 | An unassigned ticket produces no notification | Edge | P2 | An unassigned ticket with a breached target | — | 1. Trigger a run.<br>2. Re-read the ticket and list all notifications. | The ticket is escalated but no notification exists — every notification is addressed to `AssignedAgentId`. A breach on unassigned work is silent — GAP-30. | Not Run |
| TC-25-008 | An unassigned ticket gets no warning either | Edge | P2 | An unassigned ticket 10 minutes from its target | — | 1. Trigger a run. | No warning — the approaching scan skips rows where `AssignedAgentId` is null before writing. | Not Run |
| TC-25-009 | Notifications are newest first | Positive | P2 | An agent with 3 notifications sent at distinct times | — | 1. `GET /api/notifications?userId={A}`. | `200 OK` ordered by `sentAt` descending — the opposite of ticket history, which is ascending. | Not Run |
| TC-25-010 | The unread filter works | Positive | P2 | An agent with 3 notifications, one already read | — | 1. `GET /api/notifications?userId={A}&unreadOnly=true`. | Only the 2 unread are returned. Omitting the parameter defaults to `false` and returns all 3. | Not Run |
| TC-25-011 | Mark a notification as read | Positive | P2 | An unread notification | — | 1. `POST /api/notifications/{id}/read`.<br>2. Re-run the unread query. | `204 No Content`, and the notification leaves the unread list but stays in the full list. | Not Run |
| TC-25-012 | Marking an already-read notification is idempotent | Edge | P3 | A notification already marked read | — | 1. `POST /api/notifications/{id}/read` again. | `204 No Content` and nothing changes — there is no guard, but the write is harmless. | Not Run |
| TC-25-013 | Mark a non-existent notification as read | Negative | P3 | API running | A random UUID | 1. `POST /api/notifications/{random-uuid}/read`. | `404 Not Found`. | Not Run |
| TC-25-014 | An agent with no notifications | Edge | P2 | An unused agent id | — | 1. `GET /api/notifications?userId={unused}`. | `200 OK` with `[]`. | Not Run |
| TC-25-015 | A missing `userId` is rejected | Negative | P2 | API running | No query string | 1. `GET /api/notifications`. | `400 Bad Request` — `Guid` is non-nullable. Confirm it does not fall back to `Guid.Empty` and return an empty list. | Not Run |
| TC-25-016 | Reminder and assignment notifications are never produced | Negative | P2 | A ticket with a past-due reminder, and a freshly assigned ticket | — | 1. Create a reminder due in the past and assign a ticket.<br>2. Trigger a run.<br>3. List the agent's notifications. | Neither a `Reminder` nor an `Assignment` notification appears. Both enum values are declared but unreachable, so two of the five alert types in story 25 do not exist — GAP-25 and GAP-48. | Not Run |
| TC-25-017 | The response leaks the raw entity | Edge | P3 | An agent with notifications | — | 1. `GET /api/notifications?userId={A}`.<br>2. Inspect the JSON shape. | The controller returns `Notification` model objects directly rather than a DTO, unlike every other endpoint in the API. Any future column added to the entity is exposed automatically. Raise as a design defect. | Not Run |
| TC-25-018 | Notifications cannot be deleted or bulk-cleared | Negative | P3 | An agent with 50 read notifications | — | 1. Look for a delete or mark-all-read route. | There are none. An agent must mark each notification read individually and the list grows without limit, with no cap and no paging on the read endpoint. Raise as a usability defect. | Not Run |
| TC-25-019 | There is no delivery channel | Negative | P2 | An agent with a `SlaBreach` notification | — | 1. Check for any outbound email, SMS or push triggered by the notification. | None. Notifications exist only as database rows the client must poll. An agent who is not looking at the dashboard is never alerted, which undercuts the point of story 25. Evidence for GAP-81. | Not Run |
| TC-25-020 | Any caller can read any user's notifications | Security | P2 | Notifications exist for agent A | Agent A's id | 1. `GET /api/notifications?userId={A}` as a different caller. | Currently `200 OK` with A's notifications, including ticket numbers and subjects. `userId` is an unverified query parameter — the same weakness as GAP-23. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-25-001, TC-25-002, TC-25-009…011 | |
| AC-2 Invalid input → 400 | TC-25-015 | |
| AC-3 Not found | TC-25-013, TC-25-014 | |
| AC-4 Authorization → 401/403 | TC-25-020 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-25 | `NotificationType.Reminder` is never written. |
| GAP-30 | Breaches on unassigned tickets notify nobody. |
| GAP-48 | `NotificationType.Assignment` is never written, so agents are not told when work is given to them. |
| GAP-81 | There is no delivery channel. Notifications are database rows requiring the client to poll, with no email, SMS or push. |
| GAP-82 | `NotificationsController` returns raw entity objects instead of a DTO. |
| GAP-83 | Notifications cannot be deleted or bulk-cleared, and the list endpoint has no cap or paging. |
