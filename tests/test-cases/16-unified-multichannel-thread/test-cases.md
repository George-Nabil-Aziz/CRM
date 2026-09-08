# Test Cases — 16 Unified multi-channel thread

| | |
|---|---|
| **Story** | [`stories/16-unified-multichannel-thread`](../../../stories/16-unified-multichannel-thread/story.md) |
| **Spec** | [`specs/16-unified-multichannel-thread`](../../../specs/16-unified-multichannel-thread/spec.md) |
| **Area** | Communication Channels |
| **Priority** | P2 |
| **Endpoints** | `GET /api/tickets/{id}/messages` |
| **Implementation** | [`TicketExtrasController.cs`](../../../backend/CrmApi/Controllers/TicketExtrasController.cs) |
| **UI** | [`ticket-detail.page.ts`](../../../frontend/src/app/pages/ticket-detail.page.ts) |

This story is the payoff for stories 11–15: because every channel routes through one ingestion
service that resolves the sender to a customer and then to that customer's newest open ticket,
messages from different channels naturally collect on the same ticket. This file verifies the
merge is correct, ordered and complete.

## Response shape

| Field | Notes |
|---|---|
| `id`, `ticketId` | UUIDs |
| `channel` | A string — `Email`, `Whatsapp`, `Sms`, `Chat` or `Webform` |
| `from` | The raw sender key: an email address, or a phone-style string |
| `body` | Stored verbatim, unescaped |
| `sentAt` | UTC; the sort key, ascending |

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-16-001 | One thread holds messages from all five channels | Positive | P2 | One customer whose email and phone are both on file, holding one `Open` ticket | One inbound message per channel | 1. Send an email, a WhatsApp, an SMS, a chat and a web-form message, allowing a distinct timestamp for each.<br>2. `GET /api/tickets/{id}/messages`. | `200 OK` with five messages on one ticket, ordered by `sentAt` ascending, each reporting its own `channel`. | Not Run |
| TC-16-002 | Channels are reported as strings | Positive | P2 | TC-16-001 has passed | — | 1. Inspect the `channel` field on each message. | The values are the strings `Email`, `Whatsapp`, `Sms`, `Chat`, `Webform` — never the numbers `0`–`4`. `JsonStringEnumConverter` is registered globally in `Program.cs`. | Not Run |
| TC-16-003 | Ordering is chronological, not grouped by channel | Positive | P2 | A ticket with messages interleaved across channels over time | — | 1. `GET /api/tickets/{id}/messages`.<br>2. Compare the sequence with the order they were sent. | The list follows time, so an email between two SMS messages appears between them. Channels are not batched together. | Not Run |
| TC-16-004 | A ticket with no messages returns an empty thread | Edge | P2 | An agent-created ticket with no inbound messages | — | 1. `GET /api/tickets/{id}/messages`. | `200 OK` with `[]` — not `404`, and not `null`. This is the common case for tickets raised by an agent on the phone. | Not Run |
| TC-16-005 | The thread of a non-existent ticket | Negative | P2 | API running | A random UUID | 1. `GET /api/tickets/{random-uuid}/messages`. | `404 Not Found`. | Not Run |
| TC-16-006 | Messages sharing a timestamp are both returned | Edge | P3 | Two messages with identical `sentAt` values | — | 1. `GET /api/tickets/{id}/messages`. | Both appear. Their relative order is undefined — there is no secondary sort key — so do not assert a specific order between them. | Not Run |
| TC-16-007 | Only this ticket's messages are returned | Positive | P2 | One customer with two open tickets, each carrying messages | — | 1. `GET /api/tickets/{A}/messages`.<br>2. `GET /api/tickets/{B}/messages`. | Each response contains only its own ticket's messages, with no bleed between them. | Not Run |
| TC-16-008 | Agent replies are absent from the thread | Negative | P2 | A ticket with several inbound messages | — | 1. Look for a route that records an outbound agent reply.<br>2. `GET /api/tickets/{id}/messages`. | The thread is inbound-only. No outbound route exists anywhere in the API, so the "unified conversation" is one-sided: an agent sees what the customer said but never what was said back. Evidence for GAP-18 — the single largest gap in this area. | Not Run |
| TC-16-009 | Internal notes stay out of the thread | Positive | P2 | A ticket with both channel messages and an internal note | — | 1. `POST /api/tickets/{id}/internal-notes`.<br>2. `GET /api/tickets/{id}/messages`. | The internal note does not appear. Internal notes and customer messages are stored in separate tables, so agent-only commentary cannot leak into a customer-visible thread. Record as verified, not as a gap. | Not Run |
| TC-16-010 | Message bodies are returned unescaped | Edge | P2 | A message whose body contains `<b>bold</b> & "quotes"` | — | 1. `GET /api/tickets/{id}/messages`. | The body returns byte-identical with no HTML escaping. Correct for an API, but it makes output encoding mandatory in the agent UI — see the UI tests for the ticket detail page. | Not Run |
| TC-16-011 | Arabic and mixed-direction text round-trip cleanly | Edge | P2 | A ticket carrying an Arabic message and an English one | — | 1. `GET /api/tickets/{id}/messages`. | Both return unchanged with no mojibake. This is the API half of story 53; the rendering half belongs to the UI tests. | Not Run |
| TC-16-012 | The thread is unbounded | Edge | P3 | A ticket with 2,000 messages | — | 1. `GET /api/tickets/{id}/messages`. | All 2,000 are returned in one response. There is no limit, no paging and no "load earlier" cursor, so a long-running conversation grows the payload without limit. Raise as a performance defect. | Not Run |
| TC-16-013 | The customer cannot read their own thread | Negative | P2 | A portal customer with an open ticket | — | 1. Look for a portal route that returns the message thread. | There is none. `GET /api/portal/tickets/{id}` returns ticket status only. The unified thread is agent-side only, so a customer cannot review their own conversation. Evidence for GAP-65. | Not Run |
| TC-16-014 | Unauthorized caller cannot read a thread | Security | P2 | Auth layer deployed | No credentials | 1. `GET /api/tickets/{id}/messages` with no `Authorization` header. | `401 Unauthorized`. Until then, any caller holding a ticket id can read the full customer conversation. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-16-001, TC-16-002, TC-16-003 | |
| AC-2 Invalid input → 400 | — | No request body or query parameters exist to invalidate |
| AC-3 Not found | TC-16-005 | |
| AC-4 Authorization → 401/403 | TC-16-014 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-18 | The thread holds inbound messages only. No outbound route exists, so the unified conversation is one-sided. |
| GAP-65 | Customers cannot read their own message thread — the portal exposes ticket status but not the conversation. |
| GAP-66 | The thread endpoint is unpaged, so a long conversation returns in a single unbounded response. |
