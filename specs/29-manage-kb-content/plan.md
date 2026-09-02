# Implementation Plan: Manage knowledge base content

**Spec**: ./spec.md
**Priority**: P3

## Approach

Restrict this endpoint to users with a content-management permission; re-index the article in search on save.

## Data Model

- **Article**: id, title, body, category, type, authorId, publishedAt

## API Surface

See `contracts/api.md` — `POST /api/kb/articles`

**Request**: title, body, category, type
**Response**: created/updated article

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Article with the fields listed in Data Fields.
2. Implement `POST /api/kb/articles` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Admin create or edit a knowledge base article.
5. Support draft vs. published states so edits can be reviewed before going live.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `kb:write` permission (Agent, Supervisor, or Admin role, as appropriate for Admins performing this action).
- **Idempotency**: not idempotent by default — each call creates a new Article. A caller that needs retry-safety should pass an `Idempotency-Key` header so a retried request returns the original record instead of creating a duplicate.
