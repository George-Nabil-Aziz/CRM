# Feature Specification: Customer satisfaction reports

**Number**: 43
**Area**: Reports & Management
**Priority**: P3
**Status**: Draft

## User Story

As a(n) **Manager**, I want to **view aggregated customer satisfaction**, so that **I can measure service quality**.

## Description

This story covers the `GET /api/reports/csat` capability in the Reports & Management area. Aggregate the Feedback table into an average/percentage-satisfied score over the requested period.

## Acceptance Criteria

1. **Happy path** — **Given** customer feedback submissions, **When** a manager views the report, **Then** aggregated CSAT scores are shown
2. **Invalid input** — Given the request omits a required parameter or supplies one in an invalid format, **When** it is submitted, **Then** the system returns a 400 error describing the problem.
3. **Not found / conflict** — Given the requested Feedback does not exist (or, for a list, there are no matching records), **When** the request is made, **Then** the system returns 404 for a single lookup or an empty list for a collection — never a server error.
4. **Authorization** — Given the caller does not have permission to view this data, **When** they call `GET /api/reports/csat`, **Then** the system returns 401/403 and no data is returned.

## Functional Requirements

- **FR-43-1**: System MUST allow a(n) Manager to view aggregated customer satisfaction via `GET /api/reports/csat`.
- **FR-43-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-43-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-43-4**: System MUST trend CSAT over time in weekly/monthly buckets.
- **FR-43-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Reports & Management area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `rating` | integer | Yes | Must be an integer between 1 and 5. |
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `submittedAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

## Edge Cases

- **Concurrent reads**: reads are not affected by concurrent writes to other records; a read that overlaps with a concurrent write to the same record returns either the pre- or post-write state consistently, never a mix of both.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
