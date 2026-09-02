# Feature Specification: Audit logs

**Number**: 47
**Area**: Security & Administration
**Priority**: P2
**Status**: Draft

## User Story

As a(n) **Admin**, I want to **review an audit log of key actions**, so that **I can investigate and ensure accountability**.

## Description

This story covers the `GET /api/audit-logs` capability in the Security & Administration area. Write an AuditLog row from a shared middleware whenever a security-relevant or config-changing endpoint is called.

## Acceptance Criteria

1. **Happy path** — **Given** any security-relevant or config change, **When** it occurs, **Then** it is recorded in the audit log with who/what/when
2. **Invalid input** — Given the request omits a required parameter or supplies one in an invalid format, **When** it is submitted, **Then** the system returns a 400 error describing the problem.
3. **Not found / conflict** — Given the requested AuditLog does not exist (or, for a list, there are no matching records), **When** the request is made, **Then** the system returns 404 for a single lookup or an empty list for a collection — never a server error.
4. **Authorization** — Given the caller does not have permission to view this data, **When** they call `GET /api/audit-logs`, **Then** the system returns 401/403 and no data is returned.

## Functional Requirements

- **FR-47-1**: System MUST allow a(n) Admin to review an audit log of key actions via `GET /api/audit-logs`.
- **FR-47-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-47-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-47-4**: System MUST make audit log entries immutable (no update/delete endpoint).
- **FR-47-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Security & Administration area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `actorId` | string (UUID) | Yes | Must reference an existing record. |
| `action` | string | Yes | Must be provided and non-empty. |
| `targetType` | string (enum) | No | Optional filter; one of: `customer`, `ticket`, `user`, `role`, `article`, `channel_config`, `setting`. |
| `targetId` | string (UUID) | Yes | Must reference an existing record. |
| `timestamp` | string | Yes | Must be provided and non-empty. |

## Edge Cases

- **Concurrent reads**: reads are not affected by concurrent writes to other records; a read that overlaps with a concurrent write to the same record returns either the pre- or post-write state consistently, never a mix of both.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
