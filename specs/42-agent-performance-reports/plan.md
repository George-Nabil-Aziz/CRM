# Implementation Plan: Agent performance reports

**Spec**: ./spec.md
**Priority**: P3

## Approach

Aggregate resolved tickets by assignedAgentId and compute average resolution time from the ticket history log.

## Data Model

- **Ticket**: assignedAgentId, resolutionTime, ticketCount

## API Surface

See `contracts/api.md` — `GET /api/reports/agents`

**Request**: dateFrom, dateTo
**Response**: resolution time and ticket count per agent

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Ticket with the fields listed in Data Fields.
2. Implement `GET /api/reports/agents` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Manager view agent performance.
5. Rank agents and flag outliers for the manager.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `reports:read` permission (Agent, Supervisor, or Admin role, as appropriate for Managers performing this action).
- **Idempotency**: idempotent — this is a read-only GET, safe to call any number of times.
