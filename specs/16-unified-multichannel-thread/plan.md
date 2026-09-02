# Implementation Plan: Unified multi-channel thread

**Spec**: ./spec.md
**Priority**: P2

## Approach

All channel handlers write to the same Message table keyed by ticketId, so this is a single query.

## Data Model

- **Message**: id, ticketId, channel, from, body, sentAt

## API Surface

See `contracts/api.md` — `GET /api/tickets/{id}/messages`

**Request**: none
**Response**: list of messages ordered chronologically, each tagged with its channel

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Message with the fields listed in Data Fields.
2. Implement `GET /api/tickets/{id}/messages` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Agent see all of a ticket's messages in one thread regardless of channel.
5. Show a channel icon/badge per message in the UI.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `tickets:read` permission (Agent, Supervisor, or Admin role, as appropriate for Agents performing this action).
- **Idempotency**: idempotent — this is a read-only GET, safe to call any number of times.
