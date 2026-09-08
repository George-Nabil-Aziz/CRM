# Test Cases — 21 Team collaboration

| | |
|---|---|
| **Story** | [`stories/21-team-collaboration`](../../../stories/21-team-collaboration/story.md) |
| **Spec** | [`specs/21-team-collaboration`](../../../specs/21-team-collaboration/spec.md) |
| **Area** | Agent Dashboard |
| **Priority** | P2 |
| **Endpoints** | `POST /api/tickets/{id}/internal-notes`, plus `GET /api/notifications` and `POST /api/notifications/{id}/read` for the mention side |
| **Implementation** | [`TicketExtrasController.cs`](../../../backend/CrmApi/Controllers/TicketExtrasController.cs), [`NotificationsController.cs`](../../../backend/CrmApi/Controllers/NotificationsController.cs) |
| **UI** | [`ticket-detail.page.ts`](../../../frontend/src/app/pages/ticket-detail.page.ts) — note textarea plus an author GUID field |

## Mentions are explicit ids, not parsed from the text

`CreateInternalNoteRequest` takes `MentionedUserIds` as a separate list. Writing `@sara` in the
note body does nothing on its own — the client must also supply Sara's UUID. One `Mention`
notification is written per id in that list.

## The note itself is write-only

| Capability | Present |
|---|---|
| Post an internal note | Yes |
| List a ticket's internal notes | **No** |
| See notes in ticket history | **No** — `TicketEventType.Note` is never written (GAP-17) |
| Edit or delete a note | **No** |

So a colleague learns about a note only if they were explicitly mentioned and then read their
notifications. The notification message itself does not include the note text.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-21-001 | Post an internal note | Positive | P2 | An existing ticket and an author id | `{"text":"Checked the logs, this is a caching issue.","authorId":"<uuid>"}` | 1. `POST /api/tickets/{id}/internal-notes`.<br>2. Inspect the response. | `201 Created` with the matching `ticketId`, the submitted `authorId` and `text`, an empty `mentions` array, and a UTC `createdAt`. | Not Run |
| TC-21-002 | Mentioning one colleague raises one notification | Positive | P2 | An existing ticket; agent Sara exists | `{"text":"@sara please look","authorId":"<uuid>","mentionedUserIds":["<sara>"]}` | 1. `POST`.<br>2. `GET /api/notifications?userId={sara}`. | `201 Created`, and Sara has exactly one new `Mention` notification referencing this ticket. | Not Run |
| TC-21-003 | Mentioning several colleagues notifies each once | Positive | P2 | An existing ticket; agents Amir and Sara | `mentionedUserIds` containing both ids | 1. `POST`.<br>2. Check each agent's notifications. | One `Mention` notification each, both referencing the same ticket. | Not Run |
| TC-21-004 | Text mentions without ids notify nobody | Edge | P2 | An existing ticket; agent Sara | `{"text":"@sara please look","authorId":"<uuid>"}` with **no** `mentionedUserIds` | 1. `POST`.<br>2. Check Sara's notifications. | `201 Created` with `mentions: []` and **no** notification. The `@sara` text is inert — the API never parses the body. If the UI does not resolve names to ids, mentions silently fail. Verify what the client actually sends. | Not Run |
| TC-21-005 | The notification does not carry the note text | Edge | P2 | TC-21-002 has passed | — | 1. Read Sara's notification `message`. | It reads `You were mentioned on ticket <ticket-id>.` — the raw ticket UUID, with no ticket number and no note excerpt. Since notes cannot be listed either, Sara has no way to read what was written. Raise as a usability defect. | Not Run |
| TC-21-006 | An empty note is rejected | Negative | P2 | An existing ticket | `{"text":"","authorId":"<uuid>"}` | 1. `POST`. | `400 Bad Request` naming `Text`. | Not Run |
| TC-21-007 | A missing author is rejected | Negative | P2 | An existing ticket | `{"text":"x"}` | 1. `POST`. | `400 Bad Request` naming `AuthorId`. | Not Run |
| TC-21-008 | A note on a non-existent ticket | Negative | P2 | API running | A random UUID in the path | 1. `POST /api/tickets/{random-uuid}/internal-notes`. | `404 Not Found`. | Not Run |
| TC-21-009 | An internal note stays off the customer thread | Positive | P2 | TC-21-001 has passed | — | 1. `GET /api/tickets/{id}/messages`. | The note does not appear. Internal notes and channel messages live in separate tables, so agent-only commentary cannot leak to a customer-facing view. Record as verified. | Not Run |
| TC-21-010 | Mentioning a user who does not exist | Edge | P3 | An existing ticket | A random UUID in `mentionedUserIds` | 1. `POST`.<br>2. Query notifications for that id. | `201 Created` and a notification is written addressed to nobody. The ids are never validated, so a typo produces an unreachable notification and the intended person is never told. Raise as a defect. | Not Run |
| TC-21-011 | Mentioning yourself notifies you | Edge | P3 | An existing ticket | `authorId` also present in `mentionedUserIds` | 1. `POST`.<br>2. Check the author's notifications. | A `Mention` notification is created for the author. There is no self-mention filter. Minor, but it clutters an agent's own list. | Not Run |
| TC-21-012 | Duplicate ids in one mention list | Edge | P3 | An existing ticket | The same user id twice in `mentionedUserIds` | 1. `POST`.<br>2. Count that user's new notifications. | Two identical notifications are written — the list is iterated without de-duplication. Raise as a minor defect. | Not Run |
| TC-21-013 | Internal notes cannot be read back | Negative | P2 | TC-21-001 has passed | — | 1. Search the API for a route listing a ticket's internal notes. | There is none, and notes appear in no history either. Collaboration is write-only: an agent cannot see what a colleague wrote about the ticket. Evidence for GAP-26 — this makes story 21 non-functional. | Not Run |
| TC-21-014 | The note and its notifications commit together | Edge | P2 | An existing ticket; force `SaveChangesAsync` to fail | A note with two mentions | 1. `POST` while the failure is in place.<br>2. Inspect the notes table and the notifications table. | Neither the note nor any notification exists. The note and all its mention notifications are staged into a single `SaveChangesAsync`, so they are atomic. Record as verified. | Not Run |
| TC-21-015 | Mark a mention notification as read | Positive | P2 | Sara has a `Mention` notification | — | 1. `POST /api/notifications/{id}/read`.<br>2. `GET /api/notifications?userId={sara}&unreadOnly=true`. | `204 No Content`, and the notification no longer appears in the unread list but is still present in the full list. | Not Run |
| TC-21-016 | Mark a non-existent notification as read | Negative | P3 | API running | A random UUID | 1. `POST /api/notifications/{random-uuid}/read`. | `404 Not Found`. | Not Run |
| TC-21-017 | Unauthorized caller cannot post an internal note | Security | P2 | Auth layer deployed | No credentials | 1. `POST` with no `Authorization` header. | `401 Unauthorized`. Until then any caller can post an internal note attributed to any `authorId` they choose — the author field is self-declared and unverified. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-21-001…003, TC-21-015 | |
| AC-2 Invalid input → 400 | TC-21-006, TC-21-007 | |
| AC-3 Not found | TC-21-008, TC-21-016 | Mentioned ids are unchecked — TC-21-010 |
| AC-4 Authorization → 401/403 | TC-21-017 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-17 | Internal notes write no ticket-history event. |
| GAP-26 | Internal notes cannot be listed, edited or deleted, so story 21 is write-only and not functional. |
| GAP-72 | Mention notifications carry a raw ticket UUID and no note text, and the note itself is unreadable. |
| GAP-73 | `mentionedUserIds` entries are never validated or de-duplicated, so typos create unreachable notifications and repeats create duplicates. |
| GAP-74 | `authorId` is self-declared and unverified, so note authorship cannot be trusted. |
