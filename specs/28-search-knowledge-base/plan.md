# Implementation Plan: Search knowledge base

**Spec**: ./spec.md
**Priority**: P3

## Approach

Index article title/body in a full-text search index for the query endpoint.

## Data Model

- **Article**: title, body (indexed)

## API Surface

See `contracts/api.md` — `GET /api/kb/search`

**Request**: q (search query)
**Response**: ranked list of matching articles

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Article with the fields listed in Data Fields.
2. Implement `GET /api/kb/search` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Agent search the knowledge base.
5. Highlight the matching snippet in each search result.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `kb:read` permission (Agent, Supervisor, or Admin role, as appropriate for Agents performing this action).
- **Idempotency**: idempotent — this is a read-only GET, safe to call any number of times.
