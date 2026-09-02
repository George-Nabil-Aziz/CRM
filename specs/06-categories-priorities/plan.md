# Implementation Plan: Categories and priorities

**Spec**: ./spec.md
**Priority**: P1

## Approach

Reuse a fixed lookup table of categories/priorities so values stay consistent across the system.

## Data Model

- **Ticket**: category, priority

## API Surface

See `contracts/api.md` — `PATCH /api/tickets/{id}`

**Request**: category, priority
**Response**: updated ticket

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Ticket with the fields listed in Data Fields.
2. Implement `PATCH /api/tickets/{id}` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Agent set a ticket's category and priority.
5. Reject unknown category/priority values with a 400.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `tickets:write` permission (any Agent, Supervisor, or Admin role).
- **Idempotency**: idempotent — a PATCH with the same category/priority always produces the same resulting state, so it is safe to retry.
