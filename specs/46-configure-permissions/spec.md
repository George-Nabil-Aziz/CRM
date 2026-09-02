# Feature Specification: Configure permissions

**Number**: 46
**Area**: Security & Administration
**Priority**: P2
**Status**: Draft

## User Story

As a(n) **Admin**, I want to **adjust a role's permissions**, so that **users' access updates immediately**.

## Description

This story covers the `PATCH /api/roles/{id}/permissions` capability in the Security & Administration area. Store permissions as a set on the Role and check them via a single authorization middleware on every protected endpoint.

## Acceptance Criteria

1. **Happy path** — **Given** a role, **When** an admin adjusts its permissions, **Then** users with that role gain/lose the corresponding access immediately
2. **Invalid input** — Given the request contains invalid data for one of the updatable fields, **When** it is submitted, **Then** the system returns a 400 error and leaves the existing Role unchanged.
3. **Not found / conflict** — Given the target Role does not exist, **When** the update is attempted, **Then** the system returns 404 and no other resource is affected.
4. **Authorization** — Given the caller does not have permission to modify this Role, **When** they call `PATCH /api/roles/{id}/permissions`, **Then** the system returns 401/403 and the Role remains unchanged.

## Functional Requirements

- **FR-46-1**: System MUST allow a(n) Admin to adjust a role's permissions via `PATCH /api/roles/{id}/permissions`.
- **FR-46-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-46-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-46-4**: System MUST prevent an admin from removing their own admin permission and locking themself out.
- **FR-46-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Security & Administration area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `name` | string | Yes | Must be provided and non-empty. |
| `permissions` | string | Yes | Must be provided and non-empty. |

## Edge Cases

- **Concurrent updates**: the database applies updates in the order it receives them (row-level locking); the later write wins and the response reflects the final persisted state. There is no optimistic locking in v1.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
