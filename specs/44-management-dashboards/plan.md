# Implementation Plan: Management dashboards

**Spec**: ./spec.md
**Priority**: P3

## Approach

Compose the dashboard response from the same aggregation queries used by the individual reports, cached for a short TTL.

## Data Model

- **Ticket, SlaRule, Feedback (aggregate)**: summary of tickets, SLA, agent, CSAT metrics

## API Surface

See `contracts/api.md` — `GET /api/reports/dashboard`

**Request**: optional date range
**Response**: single payload combining all report summaries

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Ticket, SlaRule, Feedback (aggregate) with the fields listed in Data Fields.
2. Implement `GET /api/reports/dashboard` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Executive see key metrics at a glance.
5. Let each user pin/hide dashboard widgets.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `reports:read` permission (Agent, Supervisor, or Admin role, as appropriate for Executives performing this action).
- **Idempotency**: idempotent — this is a read-only GET, safe to call any number of times.
