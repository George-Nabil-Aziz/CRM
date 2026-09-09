# Test Cases — 37 View history

| | |
|---|---|
| **Story** | [`stories/37-view-history-portal`](../../../stories/37-view-history-portal/story.md) |
| **Spec** | [`specs/37-view-history-portal`](../../../specs/37-view-history-portal/spec.md) |
| **Area** | Customer Portal |
| **Priority** | P3 |
| **Endpoints** | `GET /api/portal/tickets?customerId=&status=` |
| **Implementation** | [`PortalController.cs`](../../../backend/CrmApi/Controllers/PortalController.cs) |

This is the list counterpart to [story 36](../36-track-requests/test-cases.md). It returns every
ticket belonging to one customer, newest first, with an optional status filter. The same
observations apply: the scoping id is an unverified query parameter, and the response is the
agent-facing `TicketResponse` rather than a customer-facing shape.

Note "history" here means *the customer's list of past requests* — not an event timeline. There
is no portal route returning ticket events.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-37-001 | A customer lists their own requests | Positive | P3 | Customer A owns 4 tickets; customer B owns 2 | `?customerId={A}` | 1. `GET /api/portal/tickets?customerId={A}`. | `200 OK` with exactly A's 4 tickets. None of B's appear. | Not Run |
| TC-37-002 | The list is newest first | Positive | P3 | Customer A's tickets were created at distinct times | `?customerId={A}` | 1. `GET`.<br>2. Check the order. | Ordered by `createdAt` descending — the most recent request is at the top, which is what a customer expects. | Not Run |
| TC-37-003 | Tickets of every status are included by default | Positive | P3 | Customer A owns one ticket in each of the four statuses | No status filter | 1. `GET /api/portal/tickets?customerId={A}`. | All four are returned. There is no implicit "active only" default, so the full request history is visible — which is what story 37 asks for. | Not Run |
| TC-37-004 | Filter by status | Positive | P3 | Customer A owns tickets in several statuses | `?status=Open` | 1. `GET /api/portal/tickets?customerId={A}&status=Open`. | Only A's `Open` tickets are returned. | Not Run |
| TC-37-005 | Filter for resolved requests | Positive | P3 | Customer A owns `Resolved` and `Open` tickets | `?status=Resolved` | 1. `GET`. | Only the `Resolved` ones. This is how a portal would list tickets eligible for feedback under story 39. | Not Run |
| TC-37-006 | A customer with no requests | Edge | P3 | A customer who has never raised a ticket | Their customer id | 1. `GET /api/portal/tickets?customerId={id}`. | `200 OK` with `[]`, not `404`. This is the first-visit state and the portal must render it as an empty state, not an error. | Not Run |
| TC-37-007 | An unknown customer id returns an empty list | Edge | P3 | API running | A random UUID | 1. `GET /api/portal/tickets?customerId={random}`. | `200 OK` with `[]`. The route never checks the customer exists, so a nonexistent customer is indistinguishable from one with no tickets. Minor, but it means a typo produces silence rather than an error. | Not Run |
| TC-37-008 | A missing `customerId` is rejected | Negative | P3 | API running | No query string | 1. `GET /api/portal/tickets`. | `400 Bad Request` — `Guid` is non-nullable. Confirm it does **not** bind to `Guid.Empty` and return `[]`, which would silently hide the mistake. | Not Run |
| TC-37-009 | A malformed `customerId` is rejected | Negative | P3 | API running | `?customerId=not-a-guid` | 1. `GET`. | `400 Bad Request`. | Not Run |
| TC-37-010 | An invalid status filter is rejected | Negative | P3 | API running | `?customerId={A}&status=Archived` | 1. `GET`. | `400 Bad Request` — the value cannot bind to `TicketStatus`. | Not Run |
| TC-37-011 | The list is unbounded | Edge | P3 | A customer with 500 tickets | `?customerId={A}` | 1. `GET`.<br>2. Count the results. | All 500 are returned. There is no cap and no paging — unlike `GET /api/tickets`, which caps at 200. A long-standing customer's portal page loads their entire history at once. Raise as a performance defect. | Not Run |
| TC-37-012 | Internal fields are exposed in the list | Edge | P3 | Customer A owns an escalated, assigned ticket | `?customerId={A}` | 1. `GET` and inspect one entry. | Each entry is the full agent-facing `TicketResponse`, including `assignedAgentId`, `escalated` and `escalationReason`. The exposure of TC-36-003 is repeated for every ticket at once — GAP-111. | Not Run |
| TC-37-013 | Any caller can list any customer's requests | Security | P3 | Customer A owns several tickets | A's customer id | 1. `GET /api/portal/tickets?customerId={A}` with no credentials. | Currently `200 OK` with A's complete request history — every subject, status and escalation reason. This is a worse exposure than story 36, because a **single guessed id** returns everything rather than requiring a ticket id as well. Evidence for GAP-109. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-37-001, TC-37-002, TC-37-004 | |
| AC-2 Invalid input → 400 | TC-37-008…010 | |
| AC-3 Not found | TC-37-006, TC-37-007 | An empty result returns `[]`, not `404` |
| AC-4 Authorization → 401/403 | TC-37-013 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-109 | `customerId` is an unverified query parameter, so one guessed id returns a customer's entire request history. |
| GAP-111 | The portal list returns the agent-facing DTO, exposing `escalationReason` and `assignedAgentId` for every ticket. |
| GAP-113 | The portal ticket list has no cap and no paging. |
