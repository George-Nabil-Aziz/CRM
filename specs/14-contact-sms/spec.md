# Feature Specification: Contact via SMS

**Number**: 14
**Area**: Communication Channels
**Priority**: P2
**Status**: Draft

## User Story

As a(n) **Customer**, I want to **text support**, so that **I don't need an app or internet connection**.

## Description

This story covers the `POST /api/channels/sms/inbound` capability in the Communication Channels area. Connect an SMS provider webhook and map the sender's phone number to a customer record, same as WhatsApp.

## Acceptance Criteria

1. **Happy path** — **Given** a customer texts support, **When** the SMS is received, **Then** a ticket is created/updated from it
2. **Invalid input** — Given the inbound payload fails the provider's signature/verification check, **When** it is received, **Then** the system rejects it (401) and does not create or update a ticket.
3. **Not found / conflict** — Given the payload's sender is not yet known to the CRM, **When** it is received, **Then** the system creates a new customer record automatically before creating the ticket.
4. **Authorization** — Given the provider retries delivery of the same message, **When** the duplicate is received, **Then** the system recognizes it and does not create a second ticket/message.

## Functional Requirements

- **FR-14-1**: System MUST allow a(n) Customer to text support via `POST /api/channels/sms/inbound`.
- **FR-14-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-14-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-14-4**: System MUST handle SMS delivery-failure callbacks from the provider.
- **FR-14-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Communication Channels area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `channel` | string (fixed) | No | Always set to `sms` by this handler; not caller-supplied. |
| `from` | string | Yes | Must be provided and non-empty. |
| `body` | string | Yes | Must be provided and non-empty. |
| `receivedAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

## Edge Cases

- **Duplicate delivery**: if the provider retries delivery of the same message, the system recognizes the duplicate (via the provider's delivery ID) and does not create a second ticket or message.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
