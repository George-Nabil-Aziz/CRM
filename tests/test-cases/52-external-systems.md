# Test Cases — 52 External systems

| | |
|---|---|
| **Story** | [`stories/52-external-systems`](../../../stories/52-external-systems/story.md) |
| **Spec** | [`specs/52-external-systems`](../../../specs/52-external-systems/spec.md) |
| **Area** | Integrations |
| **Priority** | P4 |
| **Endpoints** | `POST /api/integrations/webhooks`, `GET /api/integrations/webhooks` |
| **Implementation** | [`IntegrationsController.cs`](../../../backend/CrmApi/Controllers/IntegrationsController.cs), [`WebhookDispatcher.cs`](../../../backend/CrmApi/Services/WebhookDispatcher.cs) |

## This is the one integration that genuinely works

Unlike stories 49–51, webhooks are actually wired in. `WebhookDispatcher` is injected into
`TicketsController`, `PortalController`, `ChannelIngestionService` and `SlaMonitorService`, and
deliveries really are sent.

| Event | Fired by | Payload |
|---|---|---|
| `ticket.created` | Agent create, portal create, channel ingestion creating a ticket | Full ticket |
| `ticket.updated` | Status change | Full ticket |
| `ticket.escalated` | Manual escalation | Full ticket |
| `ticket.escalated` | SLA monitor breach | **Five fields only** (GAP-33) |

Subscriber matching is `webhook.Events.Contains(eventName)` — a **substring** match on the
serialised list, not an exact element match. Delivery is best-effort: failures are logged, never
retried, and never block the triggering request.

## The signature cannot be verified

A 32-hex-character secret is generated per webhook and used to sign each delivery
(`HMACSHA256` over the JSON body). But `WebhookResponse` is `{ Id, Url, Events }` — the secret
is **never returned**, on create or on list, and there is no route to retrieve it. A subscriber
therefore has no way to obtain the key needed to verify the signature it receives.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-52-001 | Register a webhook | Positive | P4 | API running | `{"url":"https://listener.example.com/hook","events":["ticket.created"]}` | 1. `POST /api/integrations/webhooks`. | `201 Created` with a generated `id`, the URL and the event list. | Not Run |
| TC-52-002 | A registered webhook is listed | Positive | P4 | TC-52-001 has passed | — | 1. `GET /api/integrations/webhooks`. | The subscription appears with its `id`, `url` and `events`. | Not Run |
| TC-52-003 | A `ticket.created` delivery arrives | Positive | P4 | A subscriber to `ticket.created`; a listener capturing requests | — | 1. `POST /api/tickets`.<br>2. Inspect the listener. | One `POST` to the registered URL with `Content-Type: application/json` and the full ticket as the body, enums rendered as strings. | Not Run |
| TC-52-004 | The delivery carries an HMAC signature | Positive | P4 | TC-52-003 has passed | — | 1. Inspect the delivery headers. | A signature header is present, containing the uppercase hex of `HMACSHA256(secret, body)`. Confirm it is a 64-character hex string. | Not Run |
| TC-52-005 | The signature cannot be verified by the subscriber | Negative | P4 | A registered webhook | — | 1. `POST` the webhook and read the response.<br>2. `GET /api/integrations/webhooks`.<br>3. Look for the secret anywhere in the API. | The secret appears nowhere. `WebhookResponse` omits it and no retrieval route exists, so the subscriber cannot compute the expected HMAC and the signature is unverifiable. The security mechanism is present but unusable. Raise as a defect — GAP-156. | Not Run |
| TC-52-006 | Only subscribed events are delivered | Positive | P4 | A subscriber to `ticket.created` only | — | 1. Create a ticket, then change its status, then escalate it.<br>2. Count deliveries. | Exactly one — for the creation. `ticket.updated` and `ticket.escalated` are not delivered to this subscriber. | Not Run |
| TC-52-007 | Multiple events can be subscribed | Positive | P4 | A subscriber to `["ticket.created","ticket.escalated"]` | — | 1. Create a ticket and escalate it.<br>2. Count deliveries. | Two deliveries, one per event. | Not Run |
| TC-52-008 | Several subscribers all receive the event | Positive | P4 | Two subscribers to `ticket.created`, two listeners | — | 1. Create a ticket.<br>2. Inspect both listeners. | Both receive a delivery, each signed with its **own** secret. | Not Run |
| TC-52-009 | Event matching is a substring test | Negative | P4 | A subscriber registered for the event `ticket` | — | 1. Create a ticket, change its status and escalate it.<br>2. Count deliveries. | **All three** are delivered. `Events.Contains(eventName)` runs against the serialised list, so a subscriber to `ticket` matches `ticket.created`, `ticket.updated` and `ticket.escalated` — and, symmetrically, a subscriber to a longer string may fail to match. Event routing is not exact. Raise as a defect — GAP-157. | Not Run |
| TC-52-010 | An unreachable subscriber does not fail the request | Edge | P4 | A subscriber whose URL refuses connections | — | 1. `POST /api/tickets`.<br>2. Inspect the response and the created ticket. | `201 Created` and the ticket exists. The dispatcher catches and logs the failure, so a broken subscriber never breaks the product. Record as verified — this is the correct design. | Not Run |
| TC-52-011 | A failed delivery is never retried | Negative | P4 | A subscriber that is down, then brought back up | — | 1. Create a ticket while the subscriber is down.<br>2. Restore the subscriber and wait.<br>3. Inspect the listener. | Nothing arrives. There is no retry, no dead-letter queue and no delivery log, so an event missed during a brief outage is lost permanently and neither side can detect the loss. Raise as a defect — GAP-158. | Not Run |
| TC-52-012 | An event with no subscribers dispatches nothing | Edge | P4 | No webhooks registered | — | 1. Create a ticket. | No outbound request. The dispatcher returns early when the subscriber list is empty, so the JSON is not even serialised. | Not Run |
| TC-52-013 | An invalid URL is rejected | Negative | P4 | API running | `{"url":"not-a-url","events":["ticket.created"]}` | 1. `POST`. | `400 Bad Request` naming `Url` — the field carries a `[Url]` attribute. This is the only URL-validated field in the product; contrast with `attachmentUrl` (GAP-12). | Not Run |
| TC-52-014 | A missing URL or event list is rejected | Negative | P4 | API running | `url` omitted, then `events` omitted | 1. `POST` once per case. | `400 Bad Request` each time. | Not Run |
| TC-52-015 | An empty event list is accepted | Edge | P4 | API running | `{"url":"https://x.test/h","events":[]}` | 1. `POST`.<br>2. Create a ticket and inspect the listener. | `201 Created` — `[Required]` is satisfied by an empty list — and the subscriber receives nothing. A silently useless subscription. | Not Run |
| TC-52-016 | Unknown event names are accepted | Edge | P4 | API running | `{"url":"https://x.test/h","events":["ticket.deleted","made.up"]}` | 1. `POST`. | `201 Created`. Event names are unvalidated free text with no vocabulary, so a typo such as `ticket.create` produces a subscription that never fires and gives no feedback. Same shape as GAP-134 and GAP-141. | Not Run |
| TC-52-017 | A subscriber can point at an internal address | Security | P4 | API running | `{"url":"http://169.254.169.254/latest/meta-data/","events":["ticket.created"]}` | 1. `POST`.<br>2. Create a ticket. | The registration is accepted and the server issues a request to the internal address. There is no allowlist, no scheme restriction and no private-range block, so this is a server-side request forgery vector — the API can be made to POST ticket data to any address it can reach. Raise as a security defect — GAP-159. | Not Run |
| TC-52-018 | Webhooks cannot be deleted or updated | Negative | P4 | An existing subscription | — | 1. Look for update or delete routes. | There are none. A subscription — including a malicious one from TC-52-017 — can never be removed. Combined with GAP-159 this is the most serious issue in the integrations area. Evidence for GAP-160. | Not Run |
| TC-52-019 | Anyone can register a webhook | Security | P4 | API running | Any valid payload | 1. `POST /api/integrations/webhooks` with no credentials. | Currently `201 Created`. An unauthenticated caller can subscribe an external endpoint to a live feed of every ticket created, updated and escalated — a complete, permanent data exfiltration channel that nobody can revoke. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-52-001, TC-52-003, TC-52-004 | |
| AC-2 Invalid input → 400 | TC-52-013, TC-52-014 | Event names are unvalidated — TC-52-016 |
| AC-3 Not found / conflict | TC-52-012 | |
| AC-4 Authorization → 401/403 | TC-52-019 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-33 | The two `ticket.escalated` payloads differ in shape between manual and automatic escalation. |
| GAP-156 | The signing secret is never returned to the subscriber, so the HMAC signature cannot be verified. |
| GAP-157 | Event matching is a substring test rather than an exact element match, so routing is imprecise in both directions. |
| GAP-158 | Failed deliveries are never retried and no delivery log exists, so events lost during an outage are unrecoverable and undetectable. |
| GAP-159 | Webhook URLs are unrestricted, allowing requests to internal addresses — a server-side request forgery vector. |
| GAP-160 | Webhook subscriptions cannot be updated or deleted. |
