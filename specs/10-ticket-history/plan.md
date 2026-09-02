# Implementation Plan: View ticket history

**Spec**: ./spec.md
**Priority**: P1

## Approach

Write a TicketEvent row on every mutating action (status change, assignment, message, escalation).

## Data Model

- **TicketEvent**: id, ticketId, type, actorId, timestamp, details

## API Surface

See `contracts/api.md` — `GET /api/tickets/{id}/history`

**Request**: none
**Response**: list of ticket events ordered by timestamp

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for TicketEvent with the fields listed in Data Fields.
2. Implement `GET /api/tickets/{id}/history` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Agent view a ticket's full history.
5. Include channel messages inline in the same timeline.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `tickets:read` permission (any Agent, Supervisor, or Admin role).
- **Idempotency**: idempotent — this is a read-only GET, safe to call any number of times.
