# Test Cases — 12 Contact via WhatsApp

| | |
|---|---|
| **Story** | [`stories/12-contact-whatsapp`](../../../stories/12-contact-whatsapp/story.md) |
| **Spec** | [`specs/12-contact-whatsapp`](../../../specs/12-contact-whatsapp/spec.md) |
| **Area** | Communication Channels |
| **Priority** | P2 |
| **Endpoints** | `POST /api/channels/whatsapp/inbound` → **`202 Accepted`** |
| **Implementation** | [`ChannelsController.cs`](../../../backend/CrmApi/Controllers/ChannelsController.cs), [`ChannelIngestionService.cs`](../../../backend/CrmApi/Services/ChannelIngestionService.cs) |

## How WhatsApp differs from email

Both channels share the ingestion pipeline described in
[story 11](../11-contact-email/test-cases.md), but the sender key and the subject differ, and
those two differences drive most of the cases here.

| | Email | WhatsApp |
|---|---|---|
| Sender key | `Email`, matched exactly | `Phone`, matched exactly |
| Placeholder on a new customer | `Phone` left empty | `Email` set to `<32-hex>@unknown.local` |
| Subject of a new ticket | The email's subject | First 80 characters of the body |
| Validation on `from` | `[EmailAddress]` | `[MinLength(1)]` only — **any string passes** |

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-12-001 | Inbound WhatsApp matches a customer by phone | Positive | P2 | A customer with phone `+201000000001` holding an open ticket | `{"from":"+201000000001","body":"Any update?"}` | 1. `POST /api/channels/whatsapp/inbound`.<br>2. Compare `ticketId` with the existing ticket. | `202 Accepted` with `channel: "Whatsapp"`, appended to that customer's open ticket. | Not Run |
| TC-12-002 | An unknown number gets a placeholder customer | Edge | P2 | No customer with `+209999999999` | `{"from":"+209999999999","body":"Hello"}` | 1. `POST`.<br>2. Find the created customer. | A customer is created with `phone` and `name` both set to the number, and a synthetic `email` matching `^[0-9a-f]{32}@unknown\.local$`. Flag for product: these records need a merge path or they accumulate. | Not Run |
| TC-12-003 | The ticket subject is derived from the body | Edge | P2 | An unknown sender | A body of exactly 200 characters | 1. `POST`.<br>2. Read the created ticket's `subject`. | The subject is the **first 80 characters** of the body — WhatsApp passes no subject hint. | Not Run |
| TC-12-004 | A short body becomes the whole subject | Edge | P3 | An unknown sender | `{"from":"+209999999998","body":"Help"}` | 1. `POST`.<br>2. Read the subject. | The subject is `Help` — bodies of 80 characters or fewer are used whole, with no truncation marker. | Not Run |
| TC-12-005 | An empty body is rejected | Negative | P2 | API running | `{"from":"+201000000001","body":""}` | 1. `POST`. | `400 Bad Request` naming `Body`. | Not Run |
| TC-12-006 | An empty sender is rejected | Negative | P2 | API running | `{"from":"","body":"Hi"}` | 1. `POST`. | `400 Bad Request` naming `From`. | Not Run |
| TC-12-007 | Any non-empty string is accepted as a phone number | Negative | P2 | API running | `{"from":"definitely not a phone","body":"Hi"}` | 1. `POST`.<br>2. Inspect the created customer. | `202 Accepted` and a customer is created named `definitely not a phone`. `InboundPhoneMessageRequest.From` carries only `[MinLength(1)]`, with no `[Phone]` attribute — contrast with email, which is format-validated. Raise as a defect. | Not Run |
| TC-12-008 | Phone matching is exact, not normalised | Edge | P2 | A customer stored as `+201000000001` | `{"from":"00201000000001","body":"Hi"}` | 1. `POST` with the same number in a different international format.<br>2. Count customers. | A **duplicate** customer is created. The lookup is plain string equality with no normalisation, so one person reaching out from one handset can become several records. Raise as a defect — GAP-19. | Not Run |
| TC-12-009 | A repeated delivery id is ignored | Edge | P2 | A prior message with `providerDeliveryId: "wa-55"` | The identical payload | 1. `POST` again.<br>2. Count messages. | `202 Accepted` returning the original message, with no new row. | Not Run |
| TC-12-010 | A WhatsApp message reaches the unified thread | Positive | P2 | TC-12-001 has passed | — | 1. `GET /api/tickets/{id}/messages`. | The message appears with `channel: "Whatsapp"`, alongside messages from any other channel on the same ticket. | Not Run |
| TC-12-011 | A reply to a resolved ticket opens a new one | Edge | P2 | The sender's only ticket is `Resolved` | A valid message | 1. `POST`.<br>2. Inspect `ticketId`. | A new ticket is created — GAP-22, identical to the email behaviour. | Not Run |
| TC-12-012 | Auto-categorisation applies to a new WhatsApp ticket | Positive | P2 | An unknown sender | `{"from":"+209999999997","body":"My password reset link is broken"}` | 1. `POST`.<br>2. Read the new ticket's `category`. | `AiService.Categorize` runs over the body. `password` is an `Account` keyword and `broken` is a `Technical` one — record which wins and confirm the result is deterministic across runs. See story 32. | Not Run |
| TC-12-013 | The endpoint is unauthenticated and unsigned | Security | P2 | API running | Any valid payload | 1. `POST` with no credentials. | Currently `202 Accepted`. There is no auth and no WhatsApp webhook signature check, so anyone reaching the API can impersonate any customer's phone number and inject messages into their real ticket. Higher risk than the email equivalent because phone numbers are guessable — GAP-58. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-12-001, TC-12-002, TC-12-010 | |
| AC-2 Invalid input → 400 | TC-12-005, TC-12-006 | TC-12-007 shows the format itself is unvalidated |
| AC-3 Duplicate | TC-12-009 | |
| AC-4 Authorization → 401/403 | TC-12-013 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-19 | Phone matching is exact string equality with no normalisation, so one person can become several customers. |
| GAP-22 | A reply to a `Resolved` ticket opens a new ticket. |
| GAP-58 | The endpoint is unauthenticated and performs no provider signature verification. |
| GAP-60 | `InboundPhoneMessageRequest.From` has no phone-format validation, so arbitrary text becomes a customer's phone number and name. |
