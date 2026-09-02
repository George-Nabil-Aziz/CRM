# Implementation Plan: APIs

**Spec**: ./spec.md
**Priority**: P4

## Approach

Issue scoped API keys and gate every /api/v1 route through the same authorization middleware used for staff permissions.

## Data Model

- **ApiKey**: id, key, ownerId, scopes

## API Surface

See `contracts/api.md` — `GET/POST /api/v1/*`

**Request**: API key in Authorization header
**Response**: standard JSON per resource, scoped by key permissions

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for ApiKey with the fields listed in Data Fields.
2. Implement `GET/POST /api/v1/*` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Developer call the CRM API from an external system.
5. Publish an OpenAPI document generated from the same route definitions.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires a valid, correctly-scoped API key (see the ApiKey.scopes field), not a staff role.
- **Idempotency**: depends on the underlying resource and method being called through this gateway -- GET calls are idempotent, POST and PATCH calls follow the same rule as their dedicated story.
