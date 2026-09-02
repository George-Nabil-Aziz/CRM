# Implementation Plan: Submit feedback

**Spec**: ./spec.md
**Priority**: P3

## Approach

Only allow feedback submission once a ticket reaches resolved/closed status, one submission per ticket.

## Data Model

- **Feedback**: id, ticketId, rating, comment, submittedAt

## API Surface

See `contracts/api.md` — `POST /api/portal/tickets/{id}/feedback`

**Request**: rating (1-5), comment
**Response**: created feedback record

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Feedback with the fields listed in Data Fields.
2. Implement `POST /api/portal/tickets/{id}/feedback` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Customer submit feedback/rating after a ticket is resolved.
5. Feed submitted ratings into the customer satisfaction report.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `portal:write` permission (Agent, Supervisor, or Admin role, as appropriate for Customers performing this action).
- **Idempotency**: not idempotent by default — each call creates a new Feedback. A caller that needs retry-safety should pass an `Idempotency-Key` header.
