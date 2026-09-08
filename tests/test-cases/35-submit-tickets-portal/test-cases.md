# Test Cases — 35 Submit tickets via portal

| | |
|---|---|
| **Story** | [`stories/35-submit-tickets-portal`](../../../stories/35-submit-tickets-portal/story.md) |
| **Spec** | [`specs/35-submit-tickets-portal`](../../../specs/35-submit-tickets-portal/spec.md) |
| **Area** | Customer Portal |
| **Priority** | P3 |
| **Endpoints** | `POST /api/portal/tickets` |
| **Implementation** | [`PortalController.cs`](../../../backend/CrmApi/Controllers/PortalController.cs) |

## How the portal route differs from the agent route

| | `POST /api/tickets` | `POST /api/portal/tickets` |
|---|---|---|
| Priority | Caller chooses | **Forced to `Medium`** |
| Description | Not accepted | Required — stored as a `Webform` message on the new ticket |
| Auto-categorisation | No | No — the caller's `category` stands |
| Customer identity | `customerId` in the body | `customerId` in the body — **self-declared and unverified** |

Spec 35 says the request is "scoped to the authenticated customer". There is no authentication,
so the customer id is whatever the caller types. That single fact drives the security cases here
and in stories 36 and 37.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-35-001 | A customer submits a ticket through the portal | Positive | P3 | An existing customer | `{"customerId":"<valid>","subject":"Invoice is wrong","category":"Billing","description":"I was billed for two seats but only have one."}` | 1. `POST /api/portal/tickets`.<br>2. Inspect the response. | `201 Created` with `status: "Open"`, the submitted `subject` and `category`, and a generated `TCK-XXXXXXXX` ticket number. | Not Run |
| TC-35-002 | Priority is forced to Medium | Edge | P3 | An existing customer | The TC-35-001 payload with `"priority":"Urgent"` added | 1. `POST`.<br>2. Read the ticket's priority. | `Medium`. `PortalCreateTicketRequest` has no priority field, so the value is discarded — a customer cannot self-escalate. Record as verified, and note the consequence for SLA rules, which match on priority. | Not Run |
| TC-35-003 | The description is stored as a message | Positive | P3 | TC-35-001 has passed | — | 1. `GET /api/tickets/{id}/messages`. | One message with `channel: "Webform"`, `body` equal to the submitted description, and `from` set to the **customer id as a string** — not an email or a phone number, unlike every other channel. | Not Run |
| TC-35-004 | A portal ticket runs the automation rules | Positive | P3 | An assignment rule and an SLA rule matching `Billing`/`Medium` | A valid portal submission | 1. `POST`.<br>2. Read `assignedAgentId` and both SLA target fields. | The ticket is auto-assigned and both targets are stamped — `PortalController` calls the same `ApplyOnCreateAsync` as the agent route. | Not Run |
| TC-35-005 | A portal ticket dispatches the `ticket.created` webhook | Positive | P3 | A webhook subscribed to `ticket.created` | A valid portal submission | 1. `POST`.<br>2. Inspect the listener. | One delivery carrying the new ticket. | Not Run |
| TC-35-006 | An unknown customer id is rejected | Negative | P3 | API running | `customerId` set to a random UUID | 1. `POST`. | `404 Not Found` with `customerId does not reference an existing customer.` — the same wording and the same `404`-instead-of-`400` deviation as the agent route (GAP-03). | Not Run |
| TC-35-007 | A missing description is rejected | Negative | P3 | An existing customer | `description` omitted | 1. `POST`. | `400 Bad Request` naming `Description`. | Not Run |
| TC-35-008 | An empty subject or description is rejected | Negative | P3 | An existing customer | `{"subject":""}`, then `{"description":""}` | 1. `POST` once per case. | `400 Bad Request` each time. | Not Run |
| TC-35-009 | A missing or invalid category is rejected | Negative | P3 | An existing customer | `category` omitted, then `"category":"Refunds"` | 1. `POST` once per case. | `400 Bad Request` each time. Note the portal exposes the raw `TicketCategory` enum to customers, who must know values like `FeatureRequest`. | Not Run |
| TC-35-010 | The description is not auto-categorised | Negative | P3 | An existing customer | `"category":"General"` with a description full of billing keywords | 1. `POST`.<br>2. Read the ticket's category. | `General` — the caller's value stands. `AiService.Categorize` runs only inside channel ingestion, so a customer who picks the wrong category is never corrected — GAP-96. | Not Run |
| TC-35-011 | Two identical submissions create two tickets | Edge | P3 | An existing customer | The same payload twice | 1. `POST` twice. | Two separate tickets. There is no duplicate guard, and unlike the web-form channel the portal never appends to an existing open ticket — every submission is a new ticket. Confirm against the product intent. | Not Run |
| TC-35-012 | The created ticket is readable through the portal | Positive | P3 | TC-35-001 has passed | The ticket id and the customer id | 1. `GET /api/portal/tickets/{id}?customerId={customerId}`. | `200 OK` with the ticket. Note the `Location` header from the create response omits the required `customerId` query parameter, so following it verbatim returns `404` — the created resource is not reachable at its own advertised URL. Raise as a defect. | Not Run |
| TC-35-013 | A customer can submit on another customer's behalf | Security | P3 | Two customers, A and B | A submission carrying **B's** `customerId` | 1. `POST /api/portal/tickets` with B's id. | Currently `201 Created` — a ticket is filed against B by someone who is not B. Spec 35 requires the request to be scoped to the authenticated customer; nothing enforces that. Evidence for GAP-109. | **Blocked** — GAP-01 |
| TC-35-014 | The portal endpoint is unauthenticated | Security | P3 | API running | Any valid payload | 1. `POST` 100 times with valid customer ids and no credentials. | All succeed. Combined with TC-35-013, anyone who can enumerate customer ids can fill the queue with tickets attributed to real customers. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-35-001, TC-35-003, TC-35-004 | |
| AC-2 Invalid input → 400 | TC-35-007…009 | TC-35-006 records the `404`-vs-`400` deviation |
| AC-3 Not found / conflict | TC-35-006, TC-35-011 | No duplicate detection |
| AC-4 Authorization → 401/403 | TC-35-013, TC-35-014 | Blocked, GAP-01 |
| "Scoped to the authenticated customer" | TC-35-013 | Expected to fail — GAP-109 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-03 | An unknown `customerId` yields `404` where the spec pattern expects `400`. |
| GAP-96 | Portal submissions bypass auto-categorisation, so a customer's category choice is never corrected. |
| GAP-109 | `customerId` is self-declared in the request body, so a caller can file a ticket as any customer. |
| GAP-110 | The create response's `Location` header omits the `customerId` query parameter the read route requires, so it resolves to `404`. |
