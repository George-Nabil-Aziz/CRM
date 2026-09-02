# Feature Specification: Agent performance reports

**Number**: 42
**Area**: Reports & Management
**Priority**: P3
**Status**: Draft

## User Story

As a(n) **Manager**, I want to **view agent performance**, so that **I can evaluate the team**.

## Description

This story covers the `GET /api/reports/agents` capability in the Reports & Management area. Aggregate resolved tickets by assignedAgentId and compute average resolution time from the ticket history log.

## Acceptance Criteria

1. **Happy path** — **Given** agent activity data, **When** a manager runs the report, **Then** resolution time and ticket counts per agent are shown
2. **Invalid input** — Given the request omits a required parameter or supplies one in an invalid format, **When** it is submitted, **Then** the system returns a 400 error describing the problem.
3. **Not found / conflict** — Given the requested Ticket does not exist (or, for a list, there are no matching records), **When** the request is made, **Then** the system returns 404 for a single lookup or an empty list for a collection — never a server error.
4. **Authorization** — Given the caller does not have permission to view this data, **When** they call `GET /api/reports/agents`, **Then** the system returns 401/403 and no data is returned.

## Functional Requirements

- **FR-42-1**: System MUST allow a(n) Manager to view agent performance via `GET /api/reports/agents`.
- **FR-42-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-42-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-42-4**: System MUST rank agents and flag outliers for the manager.
- **FR-42-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Reports & Management area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `assignedAgentId` | string (UUID) | Yes | Must reference an existing record. |
| `resolutionTime` | string | Yes | Must be provided and non-empty. |
| `ticketCount` | integer | No | Computed by the system. |

## Edge Cases

- **Concurrent reads**: reads are not affected by concurrent writes to other records; a read that overlaps with a concurrent write to the same record returns either the pre- or post-write state consistently, never a mix of both.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
