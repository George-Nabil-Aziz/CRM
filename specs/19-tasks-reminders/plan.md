# Implementation Plan: Manage tasks and reminders

**Spec**: ./spec.md
**Priority**: P2

## Approach

Store reminders in their own table and run a scheduled job that pushes due reminders as notifications.

## Data Model

- **Reminder**: id, ticketId, agentId, dueAt, note

## API Surface

See `contracts/api.md` — `POST /api/tickets/{id}/reminders`

**Request**: dueAt, note
**Response**: created reminder

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Reminder with the fields listed in Data Fields.
2. Implement `POST /api/tickets/{id}/reminders` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Agent set a reminder on a ticket.
5. Let an agent snooze or dismiss a reminder.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `tickets:write` permission (Agent, Supervisor, or Admin role, as appropriate for Agents performing this action).
- **Idempotency**: not idempotent by default — each call creates a new Reminder. A caller that needs retry-safety should pass an `Idempotency-Key` header.
