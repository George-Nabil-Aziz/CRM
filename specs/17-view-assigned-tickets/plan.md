# Implementation Plan: View assigned tickets

**Spec**: ./spec.md
**Priority**: P2

## Approach

Query tickets by assignedAgentId, defaulting to open/pending statuses.

## Data Model

- **Ticket**: id, subject, status, priority, customerId

## API Surface

See `contracts/api.md` — `GET /api/agents/me/tickets`

**Request**: none (optional status/priority filters)
**Response**: list of tickets assigned to the current agent

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Ticket with the fields listed in Data Fields.
2. Implement `GET /api/agents/me/tickets` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Agent see all tickets assigned to me.
5. Support sorting by priority and SLA due time.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `agents:read` permission (Agent, Supervisor, or Admin role, as appropriate for Agents performing this action).
- **Idempotency**: idempotent — this is a read-only GET, safe to call any number of times.
