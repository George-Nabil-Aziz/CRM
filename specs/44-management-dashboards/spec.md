# Feature Specification: Management dashboards

**Number**: 44
**Area**: Reports & Management
**Priority**: P3
**Status**: Draft

## User Story

As a(n) **Executive**, I want to **see key metrics at a glance**, so that **I get an overview without running individual reports**.

## Description

This story covers the `GET /api/reports/dashboard` capability in the Reports & Management area. Compose the dashboard response from the same aggregation queries used by the individual reports, cached for a short TTL.

## Acceptance Criteria

1. **Happy path** — **Given** an executive/manager, **When** they open the dashboard, **Then** key metrics across tickets/SLA/agents/CSAT are summarized at a glance
2. **Invalid input** — Given the request omits a required parameter or supplies one in an invalid format, **When** it is submitted, **Then** the system returns a 400 error describing the problem.
3. **Not found / conflict** — Given the requested Ticket, SlaRule, Feedback (aggregate) does not exist (or, for a list, there are no matching records), **When** the request is made, **Then** the system returns 404 for a single lookup or an empty list for a collection — never a server error.
4. **Authorization** — Given the caller does not have permission to view this data, **When** they call `GET /api/reports/dashboard`, **Then** the system returns 401/403 and no data is returned.

## Functional Requirements

- **FR-44-1**: System MUST allow a(n) Executive to see key metrics at a glance via `GET /api/reports/dashboard`.
- **FR-44-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-44-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-44-4**: System MUST let each user pin/hide dashboard widgets.
- **FR-44-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Reports & Management area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `summary of tickets` | string | Yes | Must be provided and non-empty. |
| `SLA` | string | Yes | Must be provided and non-empty. |
| `agent` | string | Yes | Must be provided and non-empty. |
| `CSAT metrics` | string | Yes | Must be provided and non-empty. |

## Edge Cases

- **Concurrent reads**: reads are not affected by concurrent writes to other records; a read that overlaps with a concurrent write to the same record returns either the pre- or post-write state consistently, never a mix of both.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
