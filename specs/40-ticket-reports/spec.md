# Feature Specification: Ticket reports

**Number**: 40
**Area**: Reports & Management
**Priority**: P3
**Status**: Draft

## User Story

As a(n) **Manager**, I want to **run a ticket volume/status report**, so that **I can monitor support operations**.

## Description

This story covers the `GET /api/reports/tickets` capability in the Reports & Management area. Aggregate directly from the Ticket table with date-range and group-by queries; consider a read replica for heavy reporting.

## Acceptance Criteria

1. **Happy path** — **Given** a date range, **When** a manager runs a ticket report, **Then** volume and status breakdowns are shown
2. **Invalid input** — Given the request omits a required parameter or supplies one in an invalid format, **When** it is submitted, **Then** the system returns a 400 error describing the problem.
3. **Not found / conflict** — Given the requested Ticket does not exist (or, for a list, there are no matching records), **When** the request is made, **Then** the system returns 404 for a single lookup or an empty list for a collection — never a server error.
4. **Authorization** — Given the caller does not have permission to view this data, **When** they call `GET /api/reports/tickets`, **Then** the system returns 401/403 and no data is returned.

## Functional Requirements

- **FR-40-1**: System MUST allow a(n) Manager to run a ticket volume/status report via `GET /api/reports/tickets`.
- **FR-40-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-40-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-40-4**: System MUST support exporting the report as CSV.
- **FR-40-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Reports & Management area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `groupBy` | string (enum) | No | Determines how the report is grouped; one of: `status`, `category`, `date`. Defaults to `status`. |

## Edge Cases

- **Concurrent reads**: reads are not affected by concurrent writes to other records; a read that overlaps with a concurrent write to the same record returns either the pre- or post-write state consistently, never a mix of both.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
