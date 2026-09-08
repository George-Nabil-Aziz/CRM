# Test Cases — 18 View customer information in context

| | |
|---|---|
| **Story** | [`stories/18-customer-info-context`](../../../stories/18-customer-info-context/story.md) |
| **Spec** | [`specs/18-customer-info-context`](../../../specs/18-customer-info-context/spec.md) |
| **Area** | Agent Dashboard |
| **Priority** | P2 |
| **Endpoints** | `GET /api/tickets/{id}/context` |
| **Implementation** | [`TicketExtrasController.cs`](../../../backend/CrmApi/Controllers/TicketExtrasController.cs) |
| **UI** | [`ticket-detail.page.ts`](../../../frontend/src/app/pages/ticket-detail.page.ts) |

## Response shape versus the specification

`TicketContextResponse` is a two-part object: `{ ticket, customer }`. Spec 18 lists four required
fields, and one of them has no home in that shape.

| Spec field | Present | Where |
|---|---|---|
| `name` | Yes | `customer.name` |
| `email` | Yes | `customer.email` |
| `phone` | Yes | `customer.phone` |
| `recentTickets` | **No** | Nowhere — GAP-24 |

The endpoint's value is saving a round trip: one call returns what would otherwise be
`GET /api/tickets/{id}` followed by `GET /api/customers/{customerId}`.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-18-001 | Context returns the ticket and its customer together | Positive | P2 | A ticket belonging to a fully populated customer | — | 1. `GET /api/tickets/{id}/context`. | `200 OK` with a `ticket` object and a `customer` object. The customer carries `id`, `name`, `email`, `phone`, `address` and `createdAt`. | Not Run |
| TC-18-002 | The ticket half matches the standalone ticket endpoint | Positive | P2 | An assigned, escalated ticket | — | 1. `GET /api/tickets/{id}/context`.<br>2. `GET /api/tickets` and locate the same ticket.<br>3. Compare the two representations. | Identical field for field — both are produced by the same mapper, so an agent UI can rely on one shape. | Not Run |
| TC-18-003 | The customer half matches the standalone customer endpoint | Positive | P2 | Any ticket | — | 1. `GET /api/tickets/{id}/context`.<br>2. `GET /api/customers/{customerId}`.<br>3. Compare. | Identical field for field. | Not Run |
| TC-18-004 | A customer with a null address is returned cleanly | Edge | P3 | A customer created without an address | — | 1. `GET /api/tickets/{id}/context`. | `200 OK` with `customer.address: null`. The field is present and explicitly null rather than omitted. | Not Run |
| TC-18-005 | Context for a non-existent ticket | Negative | P2 | API running | A random UUID | 1. `GET /api/tickets/{random-uuid}/context`. | `404 Not Found` with an empty body. | Not Run |
| TC-18-006 | Context for a ticket whose customer is missing | Edge | P3 | A ticket whose customer row was deleted directly in the database | — | 1. `GET /api/tickets/{id}/context`. | `404 Not Found` carrying `The ticket's customer could not be found.` — distinguishable from the missing-ticket case, which returns an empty body. Useful when diagnosing orphaned data. | Not Run |
| TC-18-007 | The customer's recent tickets are absent | Negative | P2 | A customer with 4 tickets | — | 1. `GET /api/tickets/{id}/context`.<br>2. Search the response for a recent-tickets collection. | There is none. Spec 18 marks `recentTickets` required, but `TicketContextResponse` carries only the ticket and the customer. **This case is expected to fail against the spec** — evidence for GAP-24. | Not Run |
| TC-18-008 | The UI compensates with a second call | Positive | P2 | A ticket whose customer has other tickets | — | 1. Open the ticket detail page.<br>2. Watch the network calls. | The page calls `GET /api/customers/{id}/history` separately to show the customer's other tickets, working around GAP-24. Confirm the history entries render and the ticket links navigate correctly. | Not Run |
| TC-18-009 | Two sequential reads are consistent | Edge | P3 | A ticket whose customer's phone is edited between the two reads | — | 1. `GET .../context`.<br>2. `PATCH /api/customers/{id}` to change the phone.<br>3. `GET .../context` again. | The second response shows the new phone. There is no caching layer, so context is always read-through. | Not Run |
| TC-18-010 | Unauthorized caller cannot read customer context | Security | P2 | Auth layer deployed | No credentials | 1. `GET /api/tickets/{id}/context` with no `Authorization` header. | `401 Unauthorized`. Until then, anyone holding a ticket id can read that customer's full contact details in one call — this endpoint is the most efficient route to personal data in the API. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-18-001, TC-18-002, TC-18-003 | |
| AC-2 Invalid input → 400 | — | No request body or query parameters exist to invalidate |
| AC-3 Not found | TC-18-005, TC-18-006 | |
| AC-4 Authorization → 401/403 | TC-18-010 | Blocked, GAP-01 |
| Data field `recentTickets` | TC-18-007 | Expected to fail — GAP-24 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-24 | `TicketContextResponse` omits `recentTickets`, which spec 18 marks required. The UI works around it with a second call to the customer history endpoint. |
