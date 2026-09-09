# Test Cases — 36 Track requests

| | |
|---|---|
| **Story** | [`stories/36-track-requests`](../../../stories/36-track-requests/story.md) |
| **Spec** | [`specs/36-track-requests`](../../../specs/36-track-requests/spec.md) |
| **Area** | Customer Portal |
| **Priority** | P3 |
| **Endpoints** | `GET /api/portal/tickets/{id}?customerId=` |
| **Implementation** | [`PortalController.cs`](../../../backend/CrmApi/Controllers/PortalController.cs) |

## Ownership is checked, but identity is not

The query is `WHERE Id == id AND CustomerId == customerId`, so a ticket is only returned when
the supplied customer id matches its owner. That is a genuine ownership check — better than the
agent-side routes, which have none — but `customerId` still comes from an **unverified query
parameter**. A caller who knows both a ticket id and its owner's customer id can read it.

The response is the full `TicketResponse`, the same object agents see. It includes the internal
`assignedAgentId` and the escalation fields.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-36-001 | A customer reads their own ticket | Positive | P3 | Customer A owns ticket T | `?customerId={A}` | 1. `GET /api/portal/tickets/{T}?customerId={A}`. | `200 OK` with the ticket: `ticketNumber`, `subject`, `status`, `category`, `priority` and `createdAt`. | Not Run |
| TC-36-002 | The status reflects agent activity | Positive | P3 | Customer A owns an `Open` ticket | — | 1. `GET` and note the status.<br>2. As an agent, `PATCH .../status` to `Pending`.<br>3. `GET` again. | The second read shows `Pending`. Tracking is read-through with no caching, which is the core of story 36. | Not Run |
| TC-36-003 | Escalation is visible to the customer | Edge | P3 | An escalated ticket owned by A | — | 1. `GET /api/portal/tickets/{T}?customerId={A}`. | `escalated: true`, `escalatedAt`, and **`escalationReason` in full**. The reason is written by an agent for internal purposes — for example "Customer is a key account" — and it is exposed verbatim to the customer. Raise as a data-exposure defect — GAP-111. | Not Run |
| TC-36-004 | The assigned agent id is exposed | Edge | P3 | An assigned ticket owned by A | — | 1. `GET` and inspect `assignedAgentId`. | The internal agent UUID is returned to the customer. It is not a name, so the leak is limited, but the portal is reusing the agent-facing DTO rather than a customer-facing one. Raise as a design defect. | Not Run |
| TC-36-005 | Another customer's ticket is not returned | Positive | P3 | Customer A owns ticket T; customer B exists | `?customerId={B}` | 1. `GET /api/portal/tickets/{T}?customerId={B}`. | `404 Not Found`. The ownership filter works, and `404` rather than `403` avoids confirming the ticket exists. Record as verified. | Not Run |
| TC-36-006 | A ticket that does not exist | Negative | P3 | API running | A random ticket UUID | 1. `GET /api/portal/tickets/{random}?customerId={A}`. | `404 Not Found` — indistinguishable from TC-36-005, which is the correct behaviour. | Not Run |
| TC-36-007 | A missing `customerId` is rejected | Negative | P3 | Customer A owns ticket T | No query string | 1. `GET /api/portal/tickets/{T}`. | `400 Bad Request` — `Guid` is non-nullable. Confirm it does not bind to `Guid.Empty` and return `404`, which would be a confusing error for a client that simply forgot the parameter. | Not Run |
| TC-36-008 | A malformed `customerId` is rejected | Negative | P3 | API running | `?customerId=not-a-guid` | 1. `GET`. | `400 Bad Request`. | Not Run |
| TC-36-009 | The message thread is not available | Negative | P3 | A ticket owned by A carrying several messages | — | 1. `GET /api/portal/tickets/{T}?customerId={A}`.<br>2. Look for the conversation. | The response is ticket metadata only. There is no portal route returning the messages, so a customer can see *that* their ticket is `Pending` but not read what was said. Evidence for GAP-65 — this is the main functional shortfall of story 36. | Not Run |
| TC-36-010 | Ticket history is not available | Negative | P3 | A ticket that has been assigned, moved and escalated | — | 1. Look for a portal route returning ticket history. | There is none. A customer sees the current status but not when it changed, so "tracking" shows a snapshot rather than progress. | Not Run |
| TC-36-011 | A resolved ticket is still readable | Edge | P3 | A `Resolved` ticket owned by A | — | 1. `GET /api/portal/tickets/{T}?customerId={A}`. | `200 OK` with `status: "Resolved"`. There is no status filter on this route, so closed requests remain trackable — which story 39 depends on, since feedback is submitted after resolution. | Not Run |
| TC-36-012 | Any caller can read a ticket given both ids | Security | P3 | Customer A owns ticket T | A's customer id and T's ticket id | 1. `GET /api/portal/tickets/{T}?customerId={A}` with no credentials, from an unrelated caller. | Currently `200 OK`. The ownership check pairs two ids, both of which appear in URLs and API responses elsewhere, and neither is a secret. Once auth exists, `customerId` must come from the session rather than the query string. Evidence for GAP-109. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-36-001, TC-36-002 | |
| AC-2 Invalid input → 400 | TC-36-007, TC-36-008 | |
| AC-3 Not found | TC-36-005, TC-36-006 | Ownership mismatch correctly returns `404`, not `403` |
| AC-4 Authorization → 401/403 | TC-36-012 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-65 | The portal exposes ticket status but not the message thread, so a customer cannot read their own conversation. |
| GAP-109 | `customerId` arrives as an unverified query parameter rather than from an authenticated session. |
| GAP-111 | The portal returns the agent-facing DTO, exposing the internally written `escalationReason` and the assigned agent's id to the customer. |
| GAP-112 | There is no portal route for ticket history, so "tracking" shows only a current snapshot. |
