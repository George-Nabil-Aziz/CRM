# Implementation Plan: Escalate tickets

**Spec**: ./spec.md
**Priority**: P1

## Approach

Escalation shares logic with the automatic SLA-breach escalation flow.

## Data Model

- **Ticket**: escalated, escalatedAt, escalationReason

## API Surface

See `contracts/api.md` — `POST /api/tickets/{id}/escalate`

**Request**: reason
**Response**: updated ticket with escalated=true

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Ticket with the fields listed in Data Fields.
2. Implement `POST /api/tickets/{id}/escalate` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Agent escalate a ticket.
5. Surface escalated tickets in a dedicated supervisor queue.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `tickets:escalate` permission — the ticket's assigned Agent, or any Supervisor/Admin.
- **Idempotency**: idempotent — escalating an already-escalated ticket is a no-op (the `escalated` flag and `escalatedAt` timestamp are left unchanged; only the first call's `escalationReason` is kept).
