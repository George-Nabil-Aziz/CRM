# Test Cases — 03 View interaction history

| | |
|---|---|
| **Story** | [`stories/03-interaction-history`](../../../stories/03-interaction-history/story.md) |
| **Spec** | [`specs/03-interaction-history`](../../../specs/03-interaction-history/spec.md) |
| **Area** | Customer Management |
| **Priority** | P1 |
| **Endpoints** | `GET /api/customers/{id}/history` |
| **Implementation** | [`CustomersController.cs`](../../../backend/CrmApi/Controllers/CustomersController.cs) |
| **UI** | [`customer-detail.page.ts`](../../../frontend/src/app/pages/customer-detail.page.ts) |

## What the timeline contains

The endpoint merges two sources into one list of `InteractionEntry` objects and sorts the
merged result by `timestamp` **descending**.

| Source | `type` | `ticketId` | `summary` |
|---|---|---|---|
| Tickets | `"ticket"` | The ticket's id | `Ticket TCK-XXXXXXXX: <subject>` |
| Notes | `"note"` | `null` | The note text |

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-03-001 | History returns tickets and notes newest first | Positive | P1 | A customer with 2 tickets and 2 notes created at distinct times | — | 1. `GET /api/customers/{id}/history`. | `200 OK` with 4 entries ordered by `timestamp` descending, interleaving both sources. | Not Run |
| TC-03-002 | Ticket entries carry a usable ticket link | Positive | P1 | A customer with at least one ticket | — | 1. `GET /api/customers/{id}/history`.<br>2. Take a `type: "ticket"` entry and call `GET /api/tickets/{ticketId}/history`. | The entry has a non-null `ticketId` and a `summary` of the form `Ticket TCK-XXXXXXXX: <subject>`. The follow-up call resolves to that ticket. | Not Run |
| TC-03-003 | Note entries carry no ticket id | Positive | P2 | A customer with at least one note | — | 1. `GET /api/customers/{id}/history`.<br>2. Inspect a `type: "note"` entry. | `ticketId` is `null` and `summary` is the note text verbatim. | Not Run |
| TC-03-004 | History of a customer with no activity is empty | Edge | P2 | A freshly created customer | — | 1. `GET /api/customers/{id}/history`. | `200 OK` with `[]` — an empty array, not `404` and not `null`. | Not Run |
| TC-03-005 | History for a non-existent customer | Negative | P2 | API running | A random UUID | 1. `GET /api/customers/{random-uuid}/history`. | `404 Not Found`. | Not Run |
| TC-03-006 | A ticket and a note sharing a timestamp are both returned | Edge | P3 | A ticket and a note with identical `createdAt` values | — | 1. `GET /api/customers/{id}/history`. | Both entries appear. Their relative order is undefined because the sort key ties and no secondary key is applied — do not assert a specific order. | Not Run |
| TC-03-007 | Channel messages do not appear in the timeline | Negative | P2 | A customer with inbound email and WhatsApp messages on a ticket | — | 1. Send inbound messages.<br>2. `GET /api/customers/{id}/history`. | Only the ticket itself appears, not the individual messages. The "interaction history" is ticket-and-note level, so the conversation is only visible through `GET /api/tickets/{id}/messages`. Confirm against the product intent of story 03. | Not Run |
| TC-03-008 | The timeline is unbounded | Edge | P3 | A customer with 400 tickets and 400 notes | — | 1. `GET /api/customers/{id}/history`. | All 800 entries are returned. Both queries are unpaged and the merge happens in memory, so a long-standing customer produces a large response and rising memory use. Raise as a performance defect. | Not Run |
| TC-03-009 | Unauthorized caller cannot read a customer's history | Security | P1 | Auth layer deployed | No credentials | 1. `GET /api/customers/{id}/history` with no `Authorization` header. | `401 Unauthorized`. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-03-001, TC-03-002 | |
| AC-2 Invalid input → 400 | — | No request body or query parameters exist to invalidate |
| AC-3 Not found | TC-03-005 | |
| AC-4 Authorization → 401/403 | TC-03-009 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-43 | The history endpoint is unpaged and merges two unbounded queries in memory. |
| GAP-44 | Ordering ties between a ticket and a note with equal timestamps are unresolved — there is no secondary sort key. |
