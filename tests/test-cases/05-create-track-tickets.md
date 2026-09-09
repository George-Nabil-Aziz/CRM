# Test Cases — 05 Create and track tickets

| | |
|---|---|
| **Story** | [`stories/05-create-track-tickets`](../../../stories/05-create-track-tickets/story.md) |
| **Spec** | [`specs/05-create-track-tickets`](../../../specs/05-create-track-tickets/spec.md) |
| **Area** | Ticket Management |
| **Priority** | P1 — the core flow of the product |
| **Endpoints** | `POST /api/tickets`, `GET /api/tickets?status=` |
| **Implementation** | [`TicketsController.cs`](../../../backend/CrmApi/Controllers/TicketsController.cs), [`TicketAutomationService.cs`](../../../backend/CrmApi/Services/TicketAutomationService.cs) |
| **UI** | [`tickets.page.ts`](../../../frontend/src/app/pages/tickets.page.ts) |

## What creation does

1. Verifies the customer exists — returns `404` if not.
2. Generates a ticket number as `TCK-` plus 8 uppercase hex characters from a fresh GUID.
3. Forces `Status = Open` regardless of any submitted value.
4. Runs `TicketAutomationService.ApplyOnCreateAsync`, which may set SLA targets and auto-assign.
5. Saves, then dispatches the `ticket.created` webhook.

## Three deviations from the spec

| Spec says | Implementation does | Gap |
|---|---|---|
| Ticket number like `TCK-00123`, sequential and human-readable | `TCK-` + 8 hex characters from a GUID | GAP-02 |
| Invalid `customerId` → `400` | `404 Not Found` | GAP-03 |
| AC-3: duplicate ticket → `409` | No duplicate detection at all — and the same spec's Edge Cases section says every request creates an independent ticket | GAP-04, a spec self-contradiction |

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-05-001 | Create a ticket for an existing customer | Positive | P1 | A customer exists; no SLA or assignment rules configured | `{"customerId":"<valid>","subject":"Cannot log in","category":"Technical","priority":"High"}` | 1. `POST /api/tickets`.<br>2. Inspect the response body. | `201 Created`. `status` is `Open`, `escalated` is `false`, `assignedAgentId` is `null`, `createdAt` is UTC, and `subject`, `category` and `priority` are echoed back. | Not Run |
| TC-05-002 | Ticket numbers are unique and correctly formatted | Positive | P1 | A customer exists | Two identical create payloads | 1. `POST /api/tickets` twice.<br>2. Compare the two `ticketNumber` values. | Both match `^TCK-[0-9A-F]{8}$` and differ from each other. Record the deviation from the sequential format spec 05 FR-05-4 requires — GAP-02. | Not Run |
| TC-05-003 | A submitted status is ignored | Edge | P2 | A customer exists | A valid payload with `"status":"Closed"` added | 1. `POST /api/tickets`. | `201 Created` with `status: "Open"`. The field is not on `CreateTicketRequest`, so it is discarded and a ticket can never be created in any state but `Open`. | Not Run |
| TC-05-004 | Unknown customer id is rejected | Negative | P1 | API running | `customerId` set to a random UUID | 1. `POST /api/tickets`. | `404 Not Found` with `customerId does not reference an existing customer.` Spec 05 AC-2 expects `400` — GAP-03. | Not Run |
| TC-05-005 | Missing subject is rejected | Negative | P1 | A customer exists | `subject` omitted | 1. `POST /api/tickets`. | `400 Bad Request` naming `Subject`. No ticket created. | Not Run |
| TC-05-006 | Empty subject is rejected | Negative | P1 | A customer exists | `{"subject":""}` plus valid fields | 1. `POST /api/tickets`. | `400 Bad Request` naming `Subject`. | Not Run |
| TC-05-007 | Missing category or priority is rejected | Negative | P1 | A customer exists | Omit `category`; then omit `priority` | 1. `POST` once per omitted field. | `400 Bad Request` each time. Both are non-nullable enums marked `[Required]`. | Not Run |
| TC-05-008 | Unrecognised enum values are rejected | Negative | P1 | A customer exists | `"category":"Refunds"`, then `"priority":"Critical"` | 1. `POST` once per invalid value. | `400 Bad Request` each time — string-enum deserialisation fails before the controller body runs. | Not Run |
| TC-05-009 | A missing `customerId` is rejected | Negative | P1 | API running | `customerId` omitted | 1. `POST /api/tickets`. | `400 Bad Request` — an omitted `Guid` binds to `Guid.Empty` and fails `[Required]`. Confirm the response is `400` and not a `404` from the existence check. | Not Run |
| TC-05-010 | Two identical requests create two tickets | Edge | P2 | A customer exists | The same payload twice | 1. `POST /api/tickets`.<br>2. `POST` the identical payload again. | Two `201 Created` responses with different `id` and `ticketNumber`. No `409`. This satisfies the spec's Edge Cases section and contradicts its AC-3 — GAP-04. | Not Run |
| TC-05-011 | Creation dispatches the `ticket.created` webhook | Positive | P2 | A webhook subscribed to `ticket.created`; a listener capturing deliveries | — | 1. Create a ticket.<br>2. Inspect the listener. | One `POST` arrives carrying the full ticket as JSON, with string enum values. | Not Run |
| TC-05-012 | The ticket list is newest-first and capped at 200 | Edge | P2 | 205 tickets exist | — | 1. `GET /api/tickets`.<br>2. Count the results and check the order. | Exactly 200 items ordered by `createdAt` descending. The 5 oldest are unreachable — there is no pagination. Raise as a defect (GAP-16). | Not Run |
| TC-05-013 | The ticket list filters by status | Positive | P1 | Tickets exist in all four statuses | `?status=Open` | 1. `GET /api/tickets?status=Open`. | `200 OK` and every returned ticket has `status: "Open"`. | Not Run |
| TC-05-014 | An invalid status filter is rejected | Negative | P2 | Tickets exist | `?status=Archived` | 1. `GET /api/tickets?status=Archived`. | `400 Bad Request` — the value cannot bind to `TicketStatus`. | Not Run |
| TC-05-015 | A failure mid-creation persists nothing | Edge | P2 | A customer exists; force `SaveChangesAsync` to fail | A valid payload | 1. `POST /api/tickets` while the failure is in place.<br>2. `GET /api/tickets`. | The request fails and no partial ticket exists. Note the automation service stages its changes into the same `SaveChangesAsync`, so the ticket and its auto-assignment event commit or fail together. | Not Run |
| TC-05-016 | Unauthorized caller cannot create a ticket | Security | P1 | Auth layer deployed | No credentials | 1. `POST /api/tickets` with no `Authorization` header. | `401 Unauthorized` and no ticket created. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-05-001, TC-05-002 | |
| AC-2 Invalid input → 400 | TC-05-005…009 | TC-05-004 records the 404-vs-400 deviation |
| AC-3 Duplicate → 409 | TC-05-010 | Contradicts the spec's own Edge Cases section — GAP-04 |
| AC-4 Authorization → 401/403 | TC-05-016 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-02 | Ticket numbers are GUID-derived hex, not the sequential human-readable format spec 05 requires. |
| GAP-03 | An unknown `customerId` yields `404` where spec 05 AC-2 expects `400`. |
| GAP-04 | Spec 05 AC-3 contradicts the same spec's Edge Cases section. The implementation follows the Edge Cases reading. |
| GAP-16 | `GET /api/tickets` caps results at 200 with no pagination. |
