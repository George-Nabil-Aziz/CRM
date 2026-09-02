# Implementation Plan: Use quick replies

**Spec**: ./spec.md
**Priority**: P2

## Approach

Maintain a QuickReply table editable by admins; the compose box fetches and inserts the chosen template's body.

## Data Model

- **QuickReply**: id, title, body, category

## API Surface

See `contracts/api.md` — `GET /api/quick-replies`

**Request**: optional category filter
**Response**: list of quick-reply templates

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for QuickReply with the fields listed in Data Fields.
2. Implement `GET /api/quick-replies` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Agent insert a quick-reply template into a response.
5. Support placeholder variables (e.g. customer name) in templates.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `quick-replies:read` permission (Agent, Supervisor, or Admin role, as appropriate for Agents performing this action).
- **Idempotency**: idempotent — this is a read-only GET, safe to call any number of times.
