# Implementation Plan: View history

**Spec**: ./spec.md
**Priority**: P3

## Approach

Filter the ticket list query by the authenticated customer's id.

## Data Model

- **Ticket**: id, subject, status, createdAt

## API Surface

See `contracts/api.md` — `GET /api/portal/tickets`

**Request**: none
**Response**: list of the customer's own tickets

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Ticket with the fields listed in Data Fields.
2. Implement `GET /api/portal/tickets` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Customer view my past ticket history.
5. Support filtering the list by status or date range.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `portal:read` permission (Agent, Supervisor, or Admin role, as appropriate for Customers performing this action).
- **Idempotency**: idempotent — this is a read-only GET, safe to call any number of times.
