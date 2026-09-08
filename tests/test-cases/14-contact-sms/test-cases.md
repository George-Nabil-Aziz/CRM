# Test Cases — 14 Contact via SMS

| | |
|---|---|
| **Story** | [`stories/14-contact-sms`](../../../stories/14-contact-sms/story.md) |
| **Spec** | [`specs/14-contact-sms`](../../../specs/14-contact-sms/spec.md) |
| **Area** | Communication Channels |
| **Priority** | P2 |
| **Endpoints** | `POST /api/channels/sms/inbound` → **`202 Accepted`** |
| **Implementation** | [`ChannelsController.cs`](../../../backend/CrmApi/Controllers/ChannelsController.cs), [`ChannelIngestionService.cs`](../../../backend/CrmApi/Services/ChannelIngestionService.cs) |

SMS and WhatsApp share the same request type (`InboundPhoneMessageRequest`) and the same
ingestion path. The only difference between them is the `MessageChannel` value recorded on the
stored message. Everything that holds for
[story 12](../12-contact-whatsapp/test-cases.md) — placeholder customers, exact phone matching,
body-derived subjects — holds identically here, so this file concentrates on what is specific to
SMS: its length characteristics and its overlap with the other phone-keyed channels.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-14-001 | Inbound SMS is stored on the `Sms` channel | Positive | P2 | A customer with phone `+201000000001` holding an open ticket | `{"from":"+201000000001","body":"Please call me"}` | 1. `POST /api/channels/sms/inbound`.<br>2. Inspect the response. | `202 Accepted` with `channel: "Sms"` on the customer's open ticket. | Not Run |
| TC-14-002 | An unknown number creates a placeholder customer | Edge | P2 | No customer with `+209999999995` | `{"from":"+209999999995","body":"I need a copy of my invoice"}` | 1. `POST`.<br>2. Find the created customer and ticket. | A customer is created with `phone` and `name` set to the number and a synthetic `@unknown.local` email. The ticket is `Open`, `Medium`, categorised `Billing` on the keyword *invoice*. | Not Run |
| TC-14-003 | SMS and WhatsApp from one number share a customer and a ticket | Edge | P3 | A customer with phone `+201000000001` holding one open ticket | One SMS then one WhatsApp message from that number | 1. `POST` the SMS.<br>2. `POST` the WhatsApp message.<br>3. Compare both `ticketId` values. | Both resolve to the same customer and the same ticket. This is what makes the unified thread in story 16 meaningful, and it follows from all three phone-keyed channels sharing one lookup. | Not Run |
| TC-14-004 | SMS de-duplicates on the provider delivery id | Edge | P2 | API running | The same payload twice with `providerDeliveryId: "sms-77"` | 1. `POST` twice.<br>2. Count messages. | The second call returns the first message and stores nothing new. Unlike chat, SMS does pass the provider id through. | Not Run |
| TC-14-005 | An empty body is rejected | Negative | P2 | API running | `{"from":"+201000000001","body":""}` | 1. `POST`. | `400 Bad Request` naming `Body`. | Not Run |
| TC-14-006 | An empty sender is rejected | Negative | P2 | API running | `{"from":"","body":"Hi"}` | 1. `POST`. | `400 Bad Request` naming `From`. | Not Run |
| TC-14-007 | A 160-character message is stored whole | Edge | P2 | A known customer | A body of exactly 160 characters — one SMS segment | 1. `POST`.<br>2. Read the message back through `GET /api/tickets/{id}/messages`. | The full 160 characters round-trip unchanged. | Not Run |
| TC-14-008 | A multi-segment message arrives as the provider sends it | Edge | P2 | A known customer | A body of 500 characters | 1. `POST`.<br>2. Read the message back. | The full text is stored as one message. The API performs no segment reassembly — if the provider delivers three segments as three separate calls, they become three messages. Confirm the gateway's behaviour before relying on this. | Not Run |
| TC-14-009 | A long SMS from an unknown sender truncates only the subject | Edge | P3 | An unknown sender | A body of 500 characters | 1. `POST`.<br>2. Compare the ticket's `subject` with the message body. | The subject is the first 80 characters; the message body retains all 500. Nothing is lost — the truncation applies to the derived subject only. | Not Run |
| TC-14-010 | Unicode and Arabic text survive a round trip | Edge | P2 | A known customer | `{"from":"+201000000001","body":"لو سمحت أحتاج مساعدة في الفاتورة"}` | 1. `POST`.<br>2. Read the message back. | The Arabic text returns byte-identical, with no mojibake and no escaping. This is the SMS half of story 53. | Not Run |
| TC-14-011 | The message reaches the unified thread | Positive | P2 | TC-14-001 has passed | — | 1. `GET /api/tickets/{id}/messages`. | The message appears with `channel: "Sms"` in `sentAt` order alongside other channels. | Not Run |
| TC-14-012 | A reply to a resolved ticket opens a new one | Edge | P2 | The sender's only ticket is `Resolved` | A valid message | 1. `POST`.<br>2. Inspect `ticketId`. | A new ticket is created — GAP-22. | Not Run |
| TC-14-013 | The customer cannot be sent an SMS reply | Negative | P2 | An open SMS ticket | — | 1. Look for an outbound SMS route. | There is none. `POST /api/integrations/channels` stores SMS credentials, but nothing sends. Ingestion is one-directional across every channel — GAP-18. | Not Run |
| TC-14-014 | The endpoint is unauthenticated and unsigned | Security | P2 | API running | Any valid payload | 1. `POST` with no credentials. | Currently `202 Accepted`. With no auth and no gateway signature check, anyone can inject SMS messages attributed to any phone number — GAP-58. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-14-001, TC-14-002, TC-14-011 | |
| AC-2 Invalid input → 400 | TC-14-005, TC-14-006 | Phone format itself is unvalidated — GAP-60 |
| AC-3 Duplicate | TC-14-004 | |
| AC-4 Authorization → 401/403 | TC-14-014 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-18 | No outbound route exists, so an SMS conversation cannot be answered through the channel it arrived on. |
| GAP-19 | Phone matching is exact string equality with no normalisation. |
| GAP-22 | A reply to a `Resolved` ticket opens a new ticket. |
| GAP-58 | The endpoint is unauthenticated and unsigned. |
| GAP-62 | There is no SMS segment reassembly. A long message split by the gateway becomes several unrelated messages. |
