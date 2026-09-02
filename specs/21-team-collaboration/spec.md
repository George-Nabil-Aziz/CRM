# Feature Specification: Team collaboration

**Number**: 21
**Area**: Agent Dashboard
**Priority**: P2
**Status**: Draft

## User Story

As a(n) **Agent**, I want to **add an internal note and mention a teammate on a ticket**, so that **we can resolve complex issues together**.

## Description

This story covers the `POST /api/tickets/{id}/internal-notes` capability in the Agent Dashboard area. Internal notes are stored separately from customer-facing messages and never sent externally.

## Acceptance Criteria

1. **Happy path** — **Given** a ticket needs another agent's input, **When** an agent adds an internal note or mention, **Then** the mentioned teammate is notified and can view it
2. **Invalid input** — Given the request is missing a required field or contains invalid data, **When** it is submitted, **Then** the system returns a 400 error identifying the invalid field(s) and does not create a InternalNote.
3. **Not found / conflict** — Given the parent resource referenced in the path does not exist, **When** the request is submitted, **Then** the system returns 404 and does not create a InternalNote.
4. **Authorization** — Given the caller does not have permission to perform this action, **When** they call `POST /api/tickets/{id}/internal-notes`, **Then** the system returns 401/403 and no InternalNote is created.

## Functional Requirements

- **FR-21-1**: System MUST allow a(n) Agent to add an internal note and mention a teammate on a ticket via `POST /api/tickets/{id}/internal-notes`.
- **FR-21-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-21-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-21-4**: System MUST send an in-app/email notification to each mentioned teammate.
- **FR-21-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Agent Dashboard area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `authorId` | string (UUID) | Yes | Must reference an existing record. |
| `text` | string | Yes | Must be provided and non-empty. |
| `mentions` | string | Yes | Must be provided and non-empty. |

## Edge Cases

- **Concurrent submissions**: each InternalNote created by this call is its own independent record, so concurrent submissions never conflict with each other — both are saved independently.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
