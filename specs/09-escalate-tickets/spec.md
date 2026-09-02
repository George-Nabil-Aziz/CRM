# Feature Specification: Escalate tickets

**Number**: 09
**Area**: Ticket Management
**Priority**: P1
**Status**: Draft

## User Story

As a(n) **Agent**, I want to **escalate a ticket**, so that **it gets attention from a supervisor**.

## Description

This story covers the `POST /api/tickets/{id}/escalate` capability in the Ticket Management area. Escalation shares logic with the automatic SLA-breach escalation flow.

## Acceptance Criteria

1. **Happy path** — **Given** a ticket needing higher-level attention, **When** an agent or the system escalates it, **Then** it is flagged and visible to supervisors
2. **Invalid input** — Given the request is missing a required field or contains invalid data, **When** it is submitted, **Then** the system returns a 400 error identifying the invalid field(s) and does not create a Ticket.
3. **Not found / conflict** — Given the parent resource referenced in the path does not exist, **When** the request is submitted, **Then** the system returns 404 and does not create a Ticket.
4. **Authorization** — Given the caller does not have permission to perform this action, **When** they call `POST /api/tickets/{id}/escalate`, **Then** the system returns 401/403 and no Ticket is created.

## Functional Requirements

- **FR-09-1**: System MUST allow a(n) Agent to escalate a ticket via `POST /api/tickets/{id}/escalate`.
- **FR-09-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-09-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-09-4**: System MUST surface escalated tickets in a dedicated supervisor queue.
- **FR-09-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Ticket Management area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `escalated` | string | Yes | Must be provided and non-empty. |
| `escalatedAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |
| `escalationReason` | string | Yes | Must be provided and non-empty. |

## Edge Cases

- **Concurrent escalation**: if a ticket is escalated twice at nearly the same time, the second call is a no-op (see Idempotency below) — the ticket ends up escalated once, not twice, and only one escalation notification is sent.
- **Downstream dependency unavailable**: the request fails fast with 503 and no partial state is persisted (the write is wrapped in a single transaction); the caller can safely retry.
- **In-progress state**: the action completes synchronously within one request/response cycle; the client shows a loading indicator until the response returns — there is no separate "in progress" state to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
