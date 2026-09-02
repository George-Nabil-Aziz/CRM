# Implementation Plan: Audit logs

**Spec**: ./spec.md
**Priority**: P2

## Approach

Write an AuditLog row from a shared middleware whenever a security-relevant or config-changing endpoint is called.

## Data Model

- **AuditLog**: id, actorId, action, targetType, targetId, timestamp

## API Surface

See `contracts/api.md` — `GET /api/audit-logs`

**Request**: optional actor/date filters
**Response**: list of audit log entries

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for AuditLog with the fields listed in Data Fields.
2. Implement `GET /api/audit-logs` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Admin review an audit log of key actions.
5. Make audit log entries immutable (no update/delete endpoint).
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `audit-logs:read` permission (Agent, Supervisor, or Admin role, as appropriate for Admins performing this action).
- **Idempotency**: idempotent — this is a read-only GET, safe to call any number of times.
