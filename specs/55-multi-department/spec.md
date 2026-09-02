# Feature Specification: Multi-department

**Number**: 55
**Area**: Platform
**Priority**: P4
**Status**: Draft

## User Story

As a(n) **Admin**, I want to **scope tickets/users to departments**, so that **different teams manage their own tickets**.

## Description

This story covers the `POST /api/departments` capability in the Platform area. Add a departmentId foreign key to Ticket and User, and filter ticket queries by the current user's department by default.

## Acceptance Criteria

1. **Happy path** — **Given** an organization with departments, **When** a ticket is created, **Then** it is scoped to the correct department
2. **Invalid input** — Given the request is missing a required field or contains invalid data, **When** it is submitted, **Then** the system returns a 400 error identifying the invalid field(s) and does not create a Department.
3. **Not found / conflict** — Given a Department with the same unique identifier already exists, **When** the request is submitted again, **Then** the system returns 409 and does not create a duplicate Department.
4. **Authorization** — Given the caller does not have permission to perform this action, **When** they call `POST /api/departments`, **Then** the system returns 401/403 and no Department is created.

## Functional Requirements

- **FR-55-1**: System MUST allow a(n) Admin to scope tickets/users to departments via `POST /api/departments`.
- **FR-55-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-55-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-55-4**: System MUST support a cross-department permission for supervisors who need visibility across teams.
- **FR-55-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Platform area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `name` | string | Yes | Must be provided and non-empty. |

## Edge Cases

- **Concurrent creation**: each request creates an independent new Department. If two requests would collide on a unique key, the database's unique constraint rejects the second one with 409; otherwise both succeed independently.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
