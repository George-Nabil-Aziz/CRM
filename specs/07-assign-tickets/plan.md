# Implementation Plan: Assign tickets to agents

**Spec**: ./spec.md
**Priority**: P1

## Approach

Assignment endpoint is also called internally by the automatic-assignment rule engine.

## Data Model

- **Ticket**: assignedAgentId

## API Surface

See `contracts/api.md` — `POST /api/tickets/{id}/assign`

**Request**: agentId
**Response**: updated ticket with assignedAgentId

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Ticket with the fields listed in Data Fields.
2. Implement `POST /api/tickets/{id}/assign` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Supervisor assign a ticket to an agent.
5. Notify the newly assigned agent.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `tickets:assign` permission (Supervisor or Admin role; a plain Agent cannot reassign a ticket away from themselves or to another agent — see story 45/46 for the role model).
- **Idempotency**: idempotent — assigning a ticket to the same agent twice is a no-op that leaves the same final state; assigning to a different agent simply overwrites the previous assignment.
