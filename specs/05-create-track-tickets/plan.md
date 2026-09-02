# Implementation Plan: Create and track tickets

**Spec**: ./spec.md
**Priority**: P1

## Approach

Add a Ticket table with a status state machine (open, pending, resolved, closed).

## Data Model

- **Ticket**: id, customerId, subject, status, category, priority, createdAt

## API Surface

See `contracts/api.md` — `POST /api/tickets`

**Request**: customerId, subject, category, priority
**Response**: created ticket with id and status=open

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Ticket with the fields listed in Data Fields.
2. Implement `POST /api/tickets` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Agent create a ticket for a customer issue.
5. Generate a human-readable ticket number (e.g. TCK-00123).
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `tickets:write` permission (any Agent, Supervisor, or Admin role; the Customer Portal's create-ticket story reuses this same permission scoped to the customer's own account).
- **Idempotency**: not idempotent by default — each call creates a new ticket. Callers that need retry-safety (e.g. a flaky network) should pass an `Idempotency-Key` header so a retried request with the same key returns the original ticket instead of creating a duplicate.
