# Feature Specification: External systems

**Number**: 52
**Area**: Integrations
**Priority**: P4
**Status**: Draft

## User Story

As a(n) **Admin**, I want to **connect another external system**, so that **data flows without manual entry**.

## Description

This story covers the `POST /api/integrations/webhooks` capability in the Integrations area. Let external systems subscribe to CRM events (ticket.created, ticket.updated, etc.) via outbound webhooks signed with a shared secret.

## Acceptance Criteria

1. **Happy path** — **Given** another external system is connected, **When** relevant data changes, **Then** it syncs into the CRM without manual re-entry
2. **Invalid input** — Given the request is missing a required field or contains invalid data, **When** it is submitted, **Then** the system returns a 400 error identifying the invalid field(s) and does not create a Webhook.
3. **Not found / conflict** — Given a Webhook with the same unique identifier already exists, **When** the request is submitted again, **Then** the system returns 409 and does not create a duplicate Webhook.
4. **Authorization** — Given the caller does not have permission to perform this action, **When** they call `POST /api/integrations/webhooks`, **Then** the system returns 401/403 and no Webhook is created.

## Functional Requirements

- **FR-52-1**: System MUST allow a(n) Admin to connect another external system via `POST /api/integrations/webhooks`.
- **FR-52-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-52-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-52-4**: System MUST retry failed webhook deliveries with backoff.
- **FR-52-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Integrations area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `url` | string (URL) | No | Must be a valid URL when present. |
| `events` | string | Yes | Must be provided and non-empty. |
| `secret` | string | Yes | Must be provided and non-empty. |

## Edge Cases

- **Concurrent creation**: each request creates an independent new Webhook. If two requests would collide on a unique key, the database's unique constraint rejects the second one with 409; otherwise both succeed independently.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
