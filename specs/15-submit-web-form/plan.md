# Implementation Plan: Submit via web form

**Spec**: ./spec.md
**Priority**: P2

## Approach

Validate and rate-limit the public form endpoint since it is unauthenticated.

## Data Model

- **Message**: id, ticketId, channel=webform, name, email, body, submittedAt

## API Surface

See `contracts/api.md` — `POST /api/channels/webform`

**Request**: form fields: name, email, subject, message
**Response**: created ticket id

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Message with the fields listed in Data Fields.
2. Implement `POST /api/channels/webform` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Customer submit a web form.
5. Add a spam/CAPTCHA check before ticket creation.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: not applicable for this handler -- the caller is the messaging provider, authenticated via signature or token verification (see contracts/api.md), not a staff role.
- **Idempotency**: not idempotent by default (each inbound message is a new event); safe redelivery is achieved via the provider's delivery-ID dedup check described above, not a client-supplied idempotency key.
