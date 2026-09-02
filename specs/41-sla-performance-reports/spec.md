# Feature Specification: SLA performance reports

**Number**: 41
**Area**: Reports & Management
**Priority**: P3
**Status**: Draft

## User Story

As a(n) **Manager**, I want to **view SLA compliance**, so that **I can track service targets**.

## Description

This story covers the `GET /api/reports/sla` capability in the Reports & Management area. Compute compliance as actual-vs-target timestamps already captured by the SLA and escalation flows.

## Acceptance Criteria

1. **Happy path** — **Given** SLA targets are configured, **When** a manager views the report, **Then** compliance rates per team/agent are shown
2. **Invalid input** — Given the request omits a required parameter or supplies one in an invalid format, **When** it is submitted, **Then** the system returns a 400 error describing the problem.
3. **Not found / conflict** — Given the requested Ticket does not exist (or, for a list, there are no matching records), **When** the request is made, **Then** the system returns 404 for a single lookup or an empty list for a collection — never a server error.
4. **Authorization** — Given the caller does not have permission to view this data, **When** they call `GET /api/reports/sla`, **Then** the system returns 401/403 and no data is returned.

## Functional Requirements

- **FR-41-1**: System MUST allow a(n) Manager to view SLA compliance via `GET /api/reports/sla`.
- **FR-41-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-41-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-41-4**: System MUST break the compliance rate down by ticket priority.
- **FR-41-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Reports & Management area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `responseTargetAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |
| `resolutionTargetAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |
| `actualResponseAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |
| `actualResolutionAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

## Edge Cases

- **Concurrent reads**: reads are not affected by concurrent writes to other records; a read that overlaps with a concurrent write to the same record returns either the pre- or post-write state consistently, never a mix of both.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
