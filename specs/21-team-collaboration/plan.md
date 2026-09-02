# Implementation Plan: Team collaboration

**Spec**: ./spec.md
**Priority**: P2

## Approach

Internal notes are stored separately from customer-facing messages and never sent externally.

## Data Model

- **InternalNote**: id, ticketId, authorId, text, mentions

## API Surface

See `contracts/api.md` — `POST /api/tickets/{id}/internal-notes`

**Request**: text, mentionedUserIds
**Response**: created internal note

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for InternalNote with the fields listed in Data Fields.
2. Implement `POST /api/tickets/{id}/internal-notes` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Agent add an internal note and mention a teammate on a ticket.
5. Send an in-app/email notification to each mentioned teammate.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `tickets:write` permission (Agent, Supervisor, or Admin role, as appropriate for Agents performing this action).
- **Idempotency**: not idempotent by default — each call creates a new InternalNote. A caller that needs retry-safety should pass an `Idempotency-Key` header.
