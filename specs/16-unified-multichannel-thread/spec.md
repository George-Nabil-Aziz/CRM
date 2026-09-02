# Feature Specification: Unified multi-channel thread

**Number**: 16
**Area**: Communication Channels
**Priority**: P2
**Status**: Draft

## User Story

As a(n) **Agent**, I want to **see all of a ticket's messages in one thread regardless of channel**, so that **I don't miss context switching channels**.

## Description

This story covers the `GET /api/tickets/{id}/messages` capability in the Communication Channels area. All channel handlers write to the same Message table keyed by ticketId, so this is a single query.

## Acceptance Criteria

1. **Happy path** — **Given** a ticket with messages from more than one channel, **When** an agent opens it, **Then** all messages appear in a single chronological thread
2. **Invalid input** — Given the request omits a required parameter or supplies one in an invalid format, **When** it is submitted, **Then** the system returns a 400 error describing the problem.
3. **Not found / conflict** — Given the requested Message does not exist (or, for a list, there are no matching records), **When** the request is made, **Then** the system returns 404 for a single lookup or an empty list for a collection — never a server error.
4. **Authorization** — Given the caller does not have permission to view this data, **When** they call `GET /api/tickets/{id}/messages`, **Then** the system returns 401/403 and no data is returned.

## Functional Requirements

- **FR-16-1**: System MUST allow a(n) Agent to see all of a ticket's messages in one thread regardless of channel via `GET /api/tickets/{id}/messages`.
- **FR-16-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-16-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-16-4**: System MUST show a channel icon/badge per message in the UI.
- **FR-16-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Communication Channels area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `channel` | string (enum) | Yes | Must be one of: `email`, `whatsapp`, `sms`, `chat`, `webform`. |
| `from` | string | Yes | Must be provided and non-empty. |
| `body` | string | Yes | Must be provided and non-empty. |
| `sentAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

## Edge Cases

- **Concurrent reads**: reads are not affected by concurrent writes to other records; a read that overlaps with a concurrent write to the same record returns either the pre- or post-write state consistently, never a mix of both.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
