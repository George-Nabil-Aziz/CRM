# Feature Specification: Manage tasks and reminders

**Number**: 19
**Area**: Agent Dashboard
**Priority**: P2
**Status**: Draft

## User Story

As a(n) **Agent**, I want to **set a reminder on a ticket**, so that **I don't forget to follow up**.

## Description

This story covers the `POST /api/tickets/{id}/reminders` capability in the Agent Dashboard area. Store reminders in their own table and run a scheduled job that pushes due reminders as notifications.

## Acceptance Criteria

1. **Happy path** — **Given** an agent sets a reminder on a ticket, **When** its due time arrives, **Then** the agent is notified
2. **Invalid input** — Given the request is missing a required field or contains invalid data, **When** it is submitted, **Then** the system returns a 400 error identifying the invalid field(s) and does not create a Reminder.
3. **Not found / conflict** — Given the parent resource referenced in the path does not exist, **When** the request is submitted, **Then** the system returns 404 and does not create a Reminder.
4. **Authorization** — Given the caller does not have permission to perform this action, **When** they call `POST /api/tickets/{id}/reminders`, **Then** the system returns 401/403 and no Reminder is created.

## Functional Requirements

- **FR-19-1**: System MUST allow a(n) Agent to set a reminder on a ticket via `POST /api/tickets/{id}/reminders`.
- **FR-19-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-19-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-19-4**: System MUST let an agent snooze or dismiss a reminder.
- **FR-19-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Agent Dashboard area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `agentId` | string (UUID) | Yes | Must reference an existing record. |
| `dueAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |
| `note` | string | Yes | Must be provided and non-empty. |

## Edge Cases

- **Concurrent submissions**: each Reminder created by this call is its own independent record, so concurrent submissions never conflict with each other — both are saved independently.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
