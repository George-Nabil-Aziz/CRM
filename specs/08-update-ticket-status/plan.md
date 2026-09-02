# Implementation Plan: Update ticket status

**Spec**: ./spec.md
**Priority**: P1

## Approach

Validate status transitions against the allowed state machine (no skipping from open to closed).

## Data Model

- **Ticket**: status

## API Surface

See `contracts/api.md` — `PATCH /api/tickets/{id}/status`

**Request**: status
**Response**: updated ticket

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Ticket with the fields listed in Data Fields.
2. Implement `PATCH /api/tickets/{id}/status` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Agent change a ticket's status.
5. Record every status change in the ticket history log.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `tickets:write` permission — the ticket's assigned Agent, or any Supervisor/Admin.
- **Idempotency**: idempotent within the allowed transition graph in spec.md's Data Fields table — setting a ticket to its current status is a no-op; setting an invalid transition (e.g. `closed`→`resolved` directly) is rejected with 400 regardless of how many times it's retried.
