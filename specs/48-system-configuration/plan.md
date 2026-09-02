# Implementation Plan: System configuration

**Spec**: ./spec.md
**Priority**: P2

## Approach

Store settings as key/value pairs and cache them in memory, invalidating the cache on update.

## Data Model

- **SystemSetting**: key, value

## API Surface

See `contracts/api.md` — `PATCH /api/settings`

**Request**: key, value
**Response**: updated setting

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for SystemSetting with the fields listed in Data Fields.
2. Implement `PATCH /api/settings` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Admin change a system setting.
5. Audit-log every settings change.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `settings:write` permission (Agent, Supervisor, or Admin role, as appropriate for Admins performing this action).
- **Idempotency**: idempotent — submitting the same update twice always produces the same resulting state, so it is safe to retry.
