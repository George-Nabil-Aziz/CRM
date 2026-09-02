# Feature Specification: Email, SMS and WhatsApp integration

**Number**: 51
**Area**: Integrations
**Priority**: P4
**Status**: Draft

## User Story

As a(n) **Admin**, I want to **configure the email/SMS/WhatsApp provider credentials**, so that **messages send/receive natively**.

## Description

This story covers the `POST /api/integrations/channels` capability in the Integrations area. Store provider credentials encrypted at rest and validate them with a test call before marking the channel active.

## Acceptance Criteria

1. **Happy path** — **Given** a provider is configured, **When** a message arrives through it, **Then** a ticket is created as in the Communication Channels area
2. **Invalid input** — Given the request is missing a required field or contains invalid data, **When** it is submitted, **Then** the system returns a 400 error identifying the invalid field(s) and does not create a ChannelConfig.
3. **Not found / conflict** — Given a ChannelConfig with the same unique identifier already exists, **When** the request is submitted again, **Then** the system returns 409 and does not create a duplicate ChannelConfig.
4. **Authorization** — Given the caller does not have permission to perform this action, **When** they call `POST /api/integrations/channels`, **Then** the system returns 401/403 and no ChannelConfig is created.

## Functional Requirements

- **FR-51-1**: System MUST allow a(n) Admin to configure the email/SMS/WhatsApp provider credentials via `POST /api/integrations/channels`.
- **FR-51-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-51-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-51-4**: System MUST show connection health status for each configured channel.
- **FR-51-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Integrations area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `channel` | string (enum) | Yes | One of: `email`, `sms`, `whatsapp`. |
| `credentials` | string | Yes | Must be provided and non-empty. |
| `status` | string (enum) | No | One of: `active`, `inactive`, `error`. Defaults to `inactive` until credentials are validated. |

## Edge Cases

- **Concurrent creation**: each request creates an independent new ChannelConfig. If two requests would collide on a unique key, the database's unique constraint rejects the second one with 409; otherwise both succeed independently.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
