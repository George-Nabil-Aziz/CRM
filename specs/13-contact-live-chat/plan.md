# Implementation Plan: Contact via live chat

**Spec**: ./spec.md
**Priority**: P2

## Approach

Use a WebSocket (or long-poll fallback) session per chat, backed by the same Message/Ticket tables as other channels.

## Data Model

- **Message**: id, ticketId, channel=chat, from, body, sentAt

## API Surface

See `contracts/api.md` — `WS /ws/chat`

**Request**: chat session open plus message events
**Response**: real-time message stream to the assigned agent

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Message with the fields listed in Data Fields.
2. Implement `WS /ws/chat` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Customer start a live chat.
5. Show a customer-is-typing indicator to the agent.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires an authenticated customer session on the customer side, or an authenticated Agent assigned to the conversation on the agent side.
- **Idempotency**: not applicable -- this is a persistent connection or stream, not a single idempotent request-response cycle.
