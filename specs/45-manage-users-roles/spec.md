# Feature Specification: Manage users and roles

**Number**: 45
**Area**: Security & Administration
**Priority**: P2
**Status**: Draft

## User Story

As a(n) **Admin**, I want to **create a user and assign a role**, so that **they can log in with the right access**.

## Description

This story covers the `POST /api/users` capability in the Security & Administration area. Add a User table with a roleId foreign key to a Role table; send an invite email with a set-password link.

## Acceptance Criteria

1. **Happy path** — **Given** an admin, **When** they create a user and assign a role, **Then** the user can log in with that role's access
2. **Invalid input** — Given the request is missing a required field or contains invalid data, **When** it is submitted, **Then** the system returns a 400 error identifying the invalid field(s) and does not create a User.
3. **Not found / conflict** — Given a User with the same unique identifier already exists, **When** the request is submitted again, **Then** the system returns 409 and does not create a duplicate User.
4. **Authorization** — Given the caller does not have permission to perform this action, **When** they call `POST /api/users`, **Then** the system returns 401/403 and no User is created.

## Functional Requirements

- **FR-45-1**: System MUST allow a(n) Admin to create a user and assign a role via `POST /api/users`.
- **FR-45-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-45-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-45-4**: System MUST prevent creating a user with a duplicate email.
- **FR-45-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Security & Administration area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `name` | string | Yes | Must be provided and non-empty. |
| `email` | string (email) | Yes | Must be a syntactically valid email address. |
| `roleId` | string (UUID) | Yes | Must reference an existing record. |

## Edge Cases

- **Concurrent creation**: each request creates an independent new User. If two requests would collide on a unique key, the database's unique constraint rejects the second one with 409; otherwise both succeed independently.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
