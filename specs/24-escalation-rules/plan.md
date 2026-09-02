# Implementation Plan: Escalation rules

**Spec**: ./spec.md
**Priority**: P2

## Approach

Run a periodic job that scans tickets past their SLA due timestamp and calls the same escalate endpoint agents use.

## Data Model

- **Ticket**: responseTargetAt, resolutionTargetAt, escalated

## API Surface

See `contracts/api.md` — `JOB sla-monitor scheduled job`

**Request**: none (scheduled job scans open tickets)
**Response**: breached tickets marked escalated and notified

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Ticket with the fields listed in Data Fields.
2. Implement `JOB sla-monitor scheduled job` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) System auto-escalate a ticket when its SLA is breached.
5. Avoid re-escalating a ticket that is already escalated.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: not applicable for the scheduled run -- no external caller to authorize. If this story exposes a manual-trigger endpoint, that endpoint requires an Admin role.
- **Idempotency**: idempotent per record -- a record already processed by a previous run is not reprocessed if the job is re-run after a partial failure.
