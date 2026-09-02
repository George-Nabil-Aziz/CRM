# Implementation Plan: Automatic assignment

**Spec**: ./spec.md
**Priority**: P2

## Approach

On ticket creation, evaluate AssignmentRules in priority order and call the same assign endpoint used by supervisors.

## Data Model

- **AssignmentRule**: id, condition, targetAgentOrTeam

## API Surface

See `contracts/api.md` — `EVENT ticket.created event handler`

**Request**: ticket payload (event-driven, no external caller)
**Response**: ticket updated with assignedAgentId

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for AssignmentRule with the fields listed in Data Fields.
2. Implement `EVENT ticket.created event handler` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) System auto-assign a new ticket based on rules.
5. Support round-robin assignment within a team when multiple agents match.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: not applicable -- this is an internal event handler triggered by the system, not by an external caller.
- **Idempotency**: idempotent -- reprocessing the same ticket event is a no-op if the action was already applied.
