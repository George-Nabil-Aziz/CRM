# Implementation Plan: Configure permissions

**Spec**: ./spec.md
**Priority**: P2

## Approach

Store permissions as a set on the Role and check them via a single authorization middleware on every protected endpoint.

## Data Model

- **Role**: id, name, permissions

## API Surface

See `contracts/api.md` — `PATCH /api/roles/{id}/permissions`

**Request**: list of permission keys
**Response**: updated role

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Role with the fields listed in Data Fields.
2. Implement `PATCH /api/roles/{id}/permissions` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Admin adjust a role's permissions.
5. Prevent an admin from removing their own admin permission and locking themself out.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `roles:write` permission (Agent, Supervisor, or Admin role, as appropriate for Admins performing this action).
- **Idempotency**: idempotent — submitting the same update twice always produces the same resulting state, so it is safe to retry.
