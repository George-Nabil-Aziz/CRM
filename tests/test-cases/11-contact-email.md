# Test Cases — 11 Contact via email

| | |
|---|---|
| **Story** | [`stories/11-contact-email`](../../../stories/11-contact-email/story.md) |
| **Spec** | [`specs/11-contact-email`](../../../specs/11-contact-email/spec.md) |
| **Area** | Communication Channels |
| **Priority** | P2 |
| **Endpoints** | `POST /api/channels/email/inbound` → **`202 Accepted`** |
| **Implementation** | [`ChannelsController.cs`](../../../backend/CrmApi/Controllers/ChannelsController.cs), [`ChannelIngestionService.cs`](../../../backend/CrmApi/Services/ChannelIngestionService.cs) |

## The shared ingestion pipeline

All five channel endpoints funnel into `ChannelIngestionService.IngestAsync`, which applies
these rules in order. Email is the only channel that supplies **both** an email sender key and a
subject hint, so it exercises the pipeline most completely.

| # | Rule | Email specifics |
|---|---|---|
| 1 | If `providerDeliveryId` was seen before, return the existing message unchanged | Email supplies one — this is the retry guard |
| 2 | Match the sender to a customer | Matched on `Email`, exact string |
| 3 | If unmatched, create a customer | `Name` and `Email` both set to the address; `Phone` is empty |
| 4 | Reuse the sender's newest `Open` or `Pending` ticket, else create one | Subject comes from the email's own subject; category from `AiService`; priority `Medium` |
| 5 | Append the message; dispatch `ticket.created` only if a ticket was created | |

### Request validation

| Field | Rule |
|---|---|
| `from` | `[Required, EmailAddress]` |
| `subject` | `[Required, MinLength(1)]` |
| `body` | `[Required, MinLength(1)]` |
| `providerDeliveryId` | Optional |

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-11-001 | Inbound email joins the sender's open ticket | Positive | P2 | A customer with `layla@example.com` holding one `Open` ticket | `{"from":"layla@example.com","subject":"Re: login","body":"Still broken","providerDeliveryId":"msg-001"}` | 1. `POST /api/channels/email/inbound`.<br>2. Compare the returned `ticketId` with the existing ticket. | `202 Accepted`. `ticketId` matches the existing open ticket, `channel` is `Email`, and no new ticket is created. | Not Run |
| TC-11-002 | An unknown sender creates a customer and a ticket | Positive | P2 | No customer with `newperson@example.com` | `{"from":"newperson@example.com","subject":"Refund request","body":"I was charged twice"}` | 1. `POST`.<br>2. `GET /api/customers?q=newperson@example.com`.<br>3. Read the created ticket. | `202 Accepted`. A customer exists whose `name` **and** `email` are the address, with an empty `phone`. A ticket exists with `subject` `Refund request`, `status` `Open`, `priority` `Medium`, and `category` `Billing` — matched on the keyword *charge*. | Not Run |
| TC-11-003 | The subject becomes the new ticket's subject | Positive | P2 | An unknown sender | A distinctive subject line | 1. `POST`.<br>2. Read the created ticket's `subject`. | The ticket's subject is the email subject verbatim, not a truncation of the body — email passes a subject hint, unlike SMS and WhatsApp. | Not Run |
| TC-11-004 | A repeated delivery id is ignored | Edge | P2 | TC-11-001 has run with `providerDeliveryId: "msg-001"` | The identical payload | 1. `POST` the same payload again.<br>2. Count the messages on the ticket. | `202 Accepted` returning the **original** message id, and the message count is unchanged. This is the guard against provider retries. | Not Run |
| TC-11-005 | A different delivery id with identical content is stored twice | Edge | P2 | TC-11-001 has passed | The same body with `providerDeliveryId: "msg-002"` | 1. `POST`.<br>2. Count messages. | Two messages exist. De-duplication is keyed only on the provider id, never on content. | Not Run |
| TC-11-006 | An omitted delivery id skips the guard | Edge | P2 | A known customer | The same payload twice with no `providerDeliveryId` | 1. `POST` twice. | Two messages are stored. A provider that does not supply an id gets no retry protection. | Not Run |
| TC-11-007 | A malformed sender address is rejected | Negative | P2 | API running | `{"from":"not-an-email","subject":"x","body":"y"}` | 1. `POST`. | `400 Bad Request` naming `From`. No customer, ticket or message is created. | Not Run |
| TC-11-008 | An empty subject is rejected | Negative | P2 | API running | `{"from":"a@b.com","subject":"","body":"y"}` | 1. `POST`. | `400 Bad Request` naming `Subject`. | Not Run |
| TC-11-009 | An empty body is rejected | Negative | P2 | API running | `{"from":"a@b.com","subject":"x","body":""}` | 1. `POST`. | `400 Bad Request` naming `Body`. | Not Run |
| TC-11-010 | A reply to a resolved ticket opens a new one | Edge | P2 | The sender's only ticket is `Resolved` | A valid inbound email | 1. `POST`.<br>2. Inspect the returned `ticketId`. | A **new** ticket is created. Only `Open` and `Pending` tickets are reused, so a customer replying to a resolved case starts a fresh thread instead of reopening the original. Confirm against the intended support behaviour — GAP-22. | Not Run |
| TC-11-011 | The newest open ticket wins when several exist | Edge | P2 | A customer with two `Open` tickets created at different times | A valid inbound email | 1. `POST`.<br>2. Compare `ticketId` with both. | The message lands on the ticket with the later `createdAt`. A customer with several open issues will have replies filed against the newest one regardless of what the email is about. Raise as a defect. | Not Run |
| TC-11-012 | A new ticket dispatches the `ticket.created` webhook | Positive | P2 | A webhook subscribed to `ticket.created`; an unknown sender | A valid inbound email | 1. `POST`.<br>2. Inspect the listener. | Exactly one delivery, carrying the new ticket. | Not Run |
| TC-11-013 | Appending to an existing ticket dispatches nothing | Edge | P2 | A known customer with an open ticket; a subscriber to `ticket.created` | A valid inbound email | 1. `POST`.<br>2. Inspect the listener. | No delivery — the webhook fires only when a ticket is actually created. | Not Run |
| TC-11-014 | Email matching is exact and case-sensitive | Edge | P2 | A customer stored as `layla@example.com` | `{"from":"LAYLA@example.com",...}` | 1. `POST` with the address in different casing.<br>2. Count customers. | Verify against the database collation. Under a case-sensitive collation a **duplicate** customer is created for the same person. Record the actual behaviour — email addresses are case-insensitive in practice. | Not Run |
| TC-11-015 | The endpoint is unauthenticated | Security | P2 | API running | Any valid payload | 1. `POST` with no credentials from any origin. | Currently `202 Accepted`. This endpoint creates customers and tickets, so with no auth and no provider signature check, anyone who can reach the API can inject tickets at will. Evidence for GAP-58 — a higher risk here than on internal endpoints. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-11-001, TC-11-002, TC-11-003 | |
| AC-2 Invalid input → 400 | TC-11-007…009 | |
| AC-3 Duplicate | TC-11-004 | De-duplicated silently rather than rejected with `409` |
| AC-4 Authorization → 401/403 | TC-11-015 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-22 | A reply to a `Resolved` ticket opens a new ticket rather than reopening the original. |
| GAP-58 | Inbound channel endpoints are unauthenticated and carry no provider signature verification, yet they create customers and tickets. |
| GAP-59 | When a customer has several open tickets, an inbound message is filed against the newest regardless of its content. |
