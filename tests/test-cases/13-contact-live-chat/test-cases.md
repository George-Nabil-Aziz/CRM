# Test Cases — 13 Contact via live chat

| | |
|---|---|
| **Story** | [`stories/13-contact-live-chat`](../../../stories/13-contact-live-chat/story.md) |
| **Spec** | [`specs/13-contact-live-chat`](../../../specs/13-contact-live-chat/spec.md) |
| **Area** | Communication Channels |
| **Priority** | P2 |
| **Contract says** | `WS /ws/chat` — a WebSocket |
| **Implementation is** | `POST /api/channels/chat/messages` → **`202 Accepted`** |
| **Code** | [`ChannelsController.cs`](../../../backend/CrmApi/Controllers/ChannelsController.cs), [`ChannelIngestionService.cs`](../../../backend/CrmApi/Services/ChannelIngestionService.cs) |

## The transport does not match the specification

Spec 13 declares a WebSocket endpoint. The implementation is an HTTP send with no delivery
mechanism back to the customer at all — the controller comment describes it as "send + poll",
but no polling endpoint scoped to a chat session exists either. The consequences shape this
whole file:

| Capability story 13 implies | Available? |
|---|---|
| Customer sends a message | Yes, over HTTP |
| Customer receives an agent's reply | **No** — there is no outbound message route (GAP-18) |
| Real-time push | **No** — no WebSocket, no SSE, no long poll |
| Typing indicators, presence, read receipts | **No** |
| Session identity | **No** — chat has no session concept; the sender key is a phone-style string |

What can be tested is that a chat message is ingested and lands on the right ticket. Everything
that makes a chat a *chat* is untestable because it is not implemented.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-13-001 | A chat message is stored on the `Chat` channel | Positive | P2 | A customer with phone `+201000000001` holding an open ticket | `{"from":"+201000000001","body":"Is anyone there?"}` | 1. `POST /api/channels/chat/messages`.<br>2. Inspect the response. | `202 Accepted` with `channel: "Chat"` and the customer's open ticket id. | Not Run |
| TC-13-002 | Consecutive messages share one ticket | Positive | P2 | TC-13-001 has passed | A second message from the same sender | 1. `POST` a second chat message.<br>2. Compare the two `ticketId` values. | Both carry the same `ticketId`, so a back-and-forth stays in one thread. | Not Run |
| TC-13-003 | An unknown chat sender creates a customer | Edge | P2 | No customer with `+209999999996` | `{"from":"+209999999996","body":"Hi, I need help with my invoice"}` | 1. `POST`.<br>2. Find the created customer and ticket. | A placeholder customer is created exactly as for WhatsApp — `phone` and `name` set to the sender key, `email` a synthetic `@unknown.local` address. The ticket's subject is the first 80 characters of the body. | Not Run |
| TC-13-004 | An empty body or sender is rejected | Negative | P2 | API running | `{"from":"+201000000001","body":""}`, then an empty `from` | 1. `POST` once per case. | `400 Bad Request` each time, naming the offending field. | Not Run |
| TC-13-005 | The specified WebSocket endpoint does not exist | Negative | P3 | API running | — | 1. Attempt a WebSocket handshake against `/ws/chat`. | The handshake fails — no WebSocket is mapped anywhere in `Program.cs`. **This case is expected to fail against spec 13** and is the evidence for GAP-06. | Not Run |
| TC-13-006 | Chat has no duplicate-submit protection | Edge | P3 | A known customer | The identical payload twice | 1. `POST` the same chat message twice.<br>2. Count messages on the ticket. | Two messages are stored. The controller hard-codes `providerDeliveryId` to `null`, so ingestion rule 1 never applies. A double-click in the chat widget, or a client retry on a slow network, duplicates the message. Raise as a defect — GAP-20. | Not Run |
| TC-13-007 | The customer cannot receive a reply | Negative | P2 | An open chat ticket | — | 1. Search the API for a route that sends a message **to** the customer. | There is none. A customer can start a chat and be heard, but nothing can be said back through the channel. Evidence for GAP-18 — this makes story 13 non-functional end to end. | Not Run |
| TC-13-008 | The customer cannot poll for new messages | Negative | P2 | An open chat ticket | — | 1. Look for a customer-facing route that returns the message thread. | `GET /api/tickets/{id}/messages` exists but is an agent-side route requiring the ticket id, and the portal exposes no message thread. Even the documented "send + poll" fallback is not reachable by a customer. | Not Run |
| TC-13-009 | Chat messages appear in the unified thread | Positive | P2 | A ticket carrying chat and email messages | — | 1. `GET /api/tickets/{id}/messages`. | Both appear in one `sentAt`-ascending list, distinguished by `channel`. The agent side of the conversation is intact even though the customer side is not. | Not Run |
| TC-13-010 | Chat sender keys collide with WhatsApp and SMS | Edge | P3 | A customer with phone `+201000000001` | A chat message from that same string | 1. `POST` a chat message using the customer's phone number.<br>2. Inspect the resulting customer. | The same customer is matched. Chat, SMS and WhatsApp all use the phone field as the sender key with no channel scoping, so a chat widget must supply a real phone number to reach the right customer, or it creates a placeholder record. Confirm what the widget actually sends. | Not Run |
| TC-13-011 | The endpoint is unauthenticated | Security | P2 | API running | Any valid payload | 1. `POST` with no credentials. | Currently `202 Accepted`. Anyone can post a chat message as any phone number into that customer's live ticket — GAP-58. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-13-001, TC-13-002 | Partial — only the inbound half of a chat exists |
| AC-2 Invalid input → 400 | TC-13-004 | |
| AC-3 Not found / conflict | TC-13-006 | No de-duplication is applied on this channel |
| AC-4 Authorization → 401/403 | TC-13-011 | Blocked, GAP-01 |
| Contract `WS /ws/chat` | TC-13-005 | Expected to fail — GAP-06 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-06 | Spec 13 specifies `WS /ws/chat`. No WebSocket exists; the implementation is a plain HTTP `POST`. |
| GAP-18 | There is no outbound message route, so a chat is one-directional and story 13 cannot function end to end. |
| GAP-20 | The chat endpoint passes no `providerDeliveryId`, so it has no duplicate-submit protection. |
| GAP-58 | The endpoint is unauthenticated. |
| GAP-61 | Chat has no session concept. It reuses the phone-number sender key shared with SMS and WhatsApp. |
