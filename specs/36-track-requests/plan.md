# Implementation Plan: Track requests

**Spec**: ./spec.md
**Priority**: P3

## Approach

Same ticket-read endpoint agents use, restricted to tickets owned by the logged-in customer.

## Data Model

- **Ticket**: id, subject, status, lastUpdatedAt

## API Surface

See `contracts/api.md` — `GET /api/portal/tickets/{id}`

**Request**: none
**Response**: ticket status detail

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Ticket with the fields listed in Data Fields.
2. Implement `GET /api/portal/tickets/{id}` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Customer track the status of my requests.
5. Push a status-change notification to the customer automatically.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `portal:read` permission (Agent, Supervisor, or Admin role, as appropriate for Customers performing this action).
- **Idempotency**: idempotent — this is a read-only GET, safe to call any number of times.
