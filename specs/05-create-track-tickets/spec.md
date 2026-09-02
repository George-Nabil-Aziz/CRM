# Feature Specification: Create and track tickets

**Number**: 05
**Area**: Ticket Management
**Priority**: P1
**Status**: Draft

## User Story

As a(n) **Agent**, I want to **create a ticket for a customer issue**, so that **the issue is tracked from open to resolved**.

## Description

This story covers the `POST /api/tickets` capability in the Ticket Management area. Add a Ticket table with a status state machine (open, pending, resolved, closed).

## Acceptance Criteria

1. **Happy path** — **Given** a customer issue, **When** an agent creates a ticket, **Then** it is saved with a unique ID and "open" status and can be tracked to closure
2. **Invalid input** — Given the request is missing a required field or contains invalid data, **When** it is submitted, **Then** the system returns a 400 error identifying the invalid field(s) and does not create a Ticket.
3. **Not found / conflict** — Given a Ticket with the same unique identifier already exists, **When** the request is submitted again, **Then** the system returns 409 and does not create a duplicate Ticket.
4. **Authorization** — Given the caller does not have permission to perform this action, **When** they call `POST /api/tickets`, **Then** the system returns 401/403 and no Ticket is created.

## Functional Requirements

- **FR-05-1**: System MUST allow a(n) Agent to create a ticket for a customer issue via `POST /api/tickets`.
- **FR-05-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-05-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-05-4**: System MUST generate a human-readable ticket number (e.g. TCK-00123).
- **FR-05-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Ticket Management area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `customerId` | string (UUID) | Yes | Must reference an existing record. |
| `subject` | string | Yes | Must be provided and non-empty. |
| `status` | string (enum) | No | One of: `open`, `pending`, `resolved`, `closed`. Defaults to `open` on creation. |
| `category` | string (enum) | Yes | Must be one of: `billing`, `technical`, `account`, `general`, `feature-request`. |
| `priority` | string (enum) | Yes | Must be one of: `low`, `medium`, `high`, `urgent`. |
| `createdAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

## Edge Cases

- **Concurrent creation**: each request creates an independent new Ticket, so two simultaneous creations never conflict — even if they describe the same underlying issue, they become two separate tickets unless a caller explicitly links/merges them later.
- **Downstream dependency unavailable**: the request fails fast with 503 and no partial ticket is persisted (the write is wrapped in a single transaction); the caller can safely retry.
- **In-progress state**: the action completes synchronously within one request/response cycle; the client shows a loading indicator until the response returns — there is no separate "in progress" state to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
