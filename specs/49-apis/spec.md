# Feature Specification: APIs

**Number**: 49
**Area**: Integrations
**Priority**: P4
**Status**: Draft

## User Story

As a(n) **Developer**, I want to **call the CRM API from an external system**, so that **we can integrate without manual re-entry**.

## Description

This story covers the `GET/POST /api/v1/*` capability in the Integrations area. Issue scoped API keys and gate every /api/v1 route through the same authorization middleware used for staff permissions.

## Acceptance Criteria

1. **Happy path** — **Given** an authorized external system, **When** it calls the CRM API, **Then** it can create/read/update tickets and customers per its permissions
2. **Invalid input** — Given the request is missing a required field or contains invalid data, **When** it is submitted, **Then** the system returns a 400 error identifying the invalid field(s) and does not create a ApiKey.
3. **Not found / conflict** — Given a ApiKey with the same unique identifier already exists, **When** the request is submitted again, **Then** the system returns 409 and does not create a duplicate ApiKey.
4. **Authorization** — Given the caller does not have permission to perform this action, **When** they call `GET/POST /api/v1/*`, **Then** the system returns 401/403 and no ApiKey is created.

## Functional Requirements

- **FR-49-1**: System MUST allow a(n) Developer to call the CRM API from an external system via `GET/POST /api/v1/*`.
- **FR-49-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-49-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-49-4**: System MUST publish an OpenAPI document generated from the same route definitions.
- **FR-49-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Integrations area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `key` | string | Yes | Must be provided and non-empty. |
| `ownerId` | string (UUID) | Yes | Must reference an existing record. |
| `scopes` | string | Yes | Must be provided and non-empty. |

## Edge Cases

- **Concurrent access**: concurrent callers are serialized by the underlying data store; the system never returns a torn or partially-applied result.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
