# Implementation Plan: SLA performance reports

**Spec**: ./spec.md
**Priority**: P3

## Approach

Compute compliance as actual-vs-target timestamps already captured by the SLA and escalation flows.

## Data Model

- **Ticket**: responseTargetAt, resolutionTargetAt, actualResponseAt, actualResolutionAt

## API Surface

See `contracts/api.md` — `GET /api/reports/sla`

**Request**: dateFrom, dateTo, optional team filter
**Response**: compliance rate per team/agent

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Ticket with the fields listed in Data Fields.
2. Implement `GET /api/reports/sla` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Manager view SLA compliance.
5. Break the compliance rate down by ticket priority.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `reports:read` permission (Agent, Supervisor, or Admin role, as appropriate for Managers performing this action).
- **Idempotency**: idempotent — this is a read-only GET, safe to call any number of times.
