# Implementation Plan: View customer information in context

**Spec**: ./spec.md
**Priority**: P2

## Approach

Compose the ticket-detail response with a joined customer summary rather than a separate round trip.

## Data Model

- **Customer**: name, email, phone, recentTickets

## API Surface

See `contracts/api.md` — `GET /api/tickets/{id}/context`

**Request**: none
**Response**: ticket plus embedded customer summary

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Customer with the fields listed in Data Fields.
2. Implement `GET /api/tickets/{id}/context` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Agent see the customer's info while viewing a ticket.
5. Cache the customer summary for the duration of the ticket view.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `tickets:read` permission (Agent, Supervisor, or Admin role, as appropriate for Agents performing this action).
- **Idempotency**: idempotent — this is a read-only GET, safe to call any number of times.
