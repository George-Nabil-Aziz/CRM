# Implementation Plan: Add notes and attachments

**Spec**: ./spec.md
**Priority**: P1

## Approach

Store note text in the database and uploaded files in object storage, linked by customer id.

## Data Model

- **Note**: id, customerId, authorId, text, attachmentUrl, createdAt

## API Surface

See `contracts/api.md` — `POST /api/customers/{id}/notes`

**Request**: text and/or file attachment
**Response**: created note object

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Note with the fields listed in Data Fields.
2. Implement `POST /api/customers/{id}/notes` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Agent add a note or attachment to a customer profile.
5. Enforce a file-size/type limit on attachments.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `customers:write` permission (any Agent, Supervisor, or Admin role).
- **Idempotency**: not idempotent — each call creates a new, independent note/attachment by design (an agent may legitimately add similar notes twice). A caller that needs exactly-once delivery on retry should pass an `Idempotency-Key` header.
