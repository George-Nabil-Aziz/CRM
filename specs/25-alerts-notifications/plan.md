# Implementation Plan: Alerts and notifications

**Spec**: ./spec.md
**Priority**: P2

## Approach

Reuse a generic Notification table/dispatcher so SLA alerts, mentions, and reminders share one delivery mechanism.

## Data Model

- **Notification**: id, userId, ticketId, type, sentAt

## API Surface

See `contracts/api.md` — `EVENT notification dispatch on SLA threshold`

**Request**: none (triggered by the SLA monitor job)
**Response**: notification delivered to agent/supervisor

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Notification with the fields listed in Data Fields.
2. Implement `EVENT notification dispatch on SLA threshold` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Agent get alerted when an SLA deadline is approaching or breached.
5. Let each user configure which alert types they receive.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: not applicable -- this is an internal event handler triggered by the system, not by an external caller.
- **Idempotency**: idempotent -- reprocessing the same ticket event is a no-op if the action was already applied.
