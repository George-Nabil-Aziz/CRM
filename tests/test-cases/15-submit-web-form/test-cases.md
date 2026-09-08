# Test Cases — 15 Submit via web form

| | |
|---|---|
| **Story** | [`stories/15-submit-web-form`](../../../stories/15-submit-web-form/story.md) |
| **Spec** | [`specs/15-submit-web-form`](../../../specs/15-submit-web-form/spec.md) |
| **Area** | Communication Channels |
| **Priority** | P2 |
| **Endpoints** | `POST /api/channels/webform` → **`202 Accepted`** |
| **Implementation** | [`ChannelsController.cs`](../../../backend/CrmApi/Controllers/ChannelsController.cs), [`ChannelIngestionService.cs`](../../../backend/CrmApi/Services/ChannelIngestionService.cs) |

## Request fields and what happens to each

The web form is the only channel that collects four fields, and one of them is thrown away.

| Field | Validation | What ingestion does with it |
|---|---|---|
| `name` | `[Required, MinLength(1)]` | **Discarded** — never reaches `IngestAsync` |
| `email` | `[Required, EmailAddress]` | The sender key, matched exactly against `Customer.Email` |
| `subject` | `[Required, MinLength(1)]` | The subject hint for a newly created ticket |
| `message` | `[Required, MinLength(1)]` | The message body |

The form also passes no `providerDeliveryId`, so — like chat — it has no duplicate-submit guard.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-15-001 | A submission from an unknown visitor creates customer and ticket | Positive | P2 | No customer with `walkin@example.com` | `{"name":"Walk In","email":"walkin@example.com","subject":"Broken link on pricing page","message":"The pricing link 404s."}` | 1. `POST /api/channels/webform`.<br>2. Read the created customer and ticket. | `202 Accepted` with `channel: "Webform"`. A customer and an `Open` ticket exist, and the ticket's `subject` is exactly `Broken link on pricing page`. | Not Run |
| TC-15-002 | The submitted name is silently discarded | Negative | P3 | No customer with `walkin2@example.com` | A valid submission with `"name":"Walk In Two"` | 1. `POST`.<br>2. Read the created customer's `name`. | The customer's `name` is the **email address**, not `Walk In Two`. The controller passes only the email into `IngestAsync`, so a field the form requires and validates is dropped. Raise as a defect — GAP-21. | Not Run |
| TC-15-003 | A submission from a known customer joins their open ticket | Positive | P2 | A customer with a matching email holding an `Open` ticket | A valid submission with a distinctive subject | 1. `POST`.<br>2. Compare `ticketId` and read the ticket's subject. | The message lands on the existing ticket, and the submitted subject is **ignored** because no new ticket is created. A returning visitor's stated topic is lost. Confirm against the product intent. | Not Run |
| TC-15-004 | An invalid email is rejected | Negative | P2 | API running | `{"name":"X","email":"bad","subject":"s","message":"m"}` | 1. `POST`. | `400 Bad Request` naming `Email`. | Not Run |
| TC-15-005 | An empty name is rejected | Negative | P2 | API running | `{"name":"","email":"a@b.com","subject":"s","message":"m"}` | 1. `POST`. | `400 Bad Request` naming `Name` — even though the value would have been discarded on success. | Not Run |
| TC-15-006 | An empty subject is rejected | Negative | P2 | API running | `{"name":"X","email":"a@b.com","subject":"","message":"m"}` | 1. `POST`. | `400 Bad Request` naming `Subject`. | Not Run |
| TC-15-007 | An empty message is rejected | Negative | P2 | API running | `{"name":"X","email":"a@b.com","subject":"s","message":""}` | 1. `POST`. | `400 Bad Request` naming `Message`. | Not Run |
| TC-15-008 | A long message does not truncate the subject | Edge | P2 | An unknown visitor | A 2,000-character `message` with a short `subject` | 1. `POST`.<br>2. Read the ticket's subject and the stored message. | The subject is the submitted subject in full — the 80-character body truncation applies only when there is no subject hint, which is never the case for this channel. The message body is stored whole. | Not Run |
| TC-15-009 | Duplicate submissions are both stored | Edge | P2 | An unknown visitor | The identical payload twice | 1. `POST` twice.<br>2. Count tickets and messages. | The first creates a ticket; the second appends to it, since that ticket is now the sender's newest open one. Two messages exist. A double-click therefore produces a duplicated message rather than a duplicated ticket — GAP-20. | Not Run |
| TC-15-010 | Auto-categorisation applies to the message body | Positive | P2 | An unknown visitor | `message` containing `I want a refund for my invoice` | 1. `POST`.<br>2. Read the new ticket's `category`. | `Billing`, matched on the keywords *refund* and *invoice*. Note that `AiService.Categorize` sees both the subject and the body. | Not Run |
| TC-15-011 | HTML in the message is stored verbatim | Edge | P2 | An unknown visitor | `message` set to `<script>alert(1)</script>` | 1. `POST`.<br>2. Read the message back through `GET /api/tickets/{id}/messages`. | The text is stored and returned unescaped. That is correct for an API, but it makes output encoding in the agent UI mandatory — pair this with the UI test for the ticket detail page. Raise the risk explicitly. | Not Run |
| TC-15-012 | The endpoint is unauthenticated and has no anti-automation control | Security | P2 | API running | Any valid payload | 1. `POST` 100 times in a loop with distinct email addresses. | All succeed, creating 100 customers and 100 tickets. There is no auth, no CAPTCHA, no rate limit and no origin restriction beyond CORS, which does not apply to server-to-server calls. A public web form endpoint is the most exposed surface in the API — GAP-63. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-15-001, TC-15-003 | |
| AC-2 Invalid input → 400 | TC-15-004…007 | |
| AC-3 Duplicate | TC-15-009 | No guard on this channel |
| AC-4 Authorization → 401/403 | TC-15-012 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-20 | The web form passes no `providerDeliveryId`, so it has no duplicate-submit protection. |
| GAP-21 | The `name` field is required and validated, then discarded. Created customers are named by their email address. |
| GAP-63 | The web form is a public, unauthenticated write endpoint with no rate limiting or anti-automation control, so it can be used to mass-create customers and tickets. |
| GAP-64 | For a returning customer the submitted subject is discarded, because the message is appended to an existing ticket. |
