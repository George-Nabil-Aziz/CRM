# Feature Specification: Assign tickets to agents

**Number**: 07
**Area**: Ticket Management
**Priority**: P1
**Status**: Draft

## User Story

As a(n) **Supervisor**, I want to **assign a ticket to an agent**, so that **workload is distributed**.

## Description

This story covers the `POST /api/tickets/{id}/assign` capability in the Ticket Management area. Assignment endpoint is also called internally by the automatic-assignment rule engine.

## Acceptance Criteria

1. **Happy path** — **Given** an unassigned ticket, **When** a supervisor or rule assigns it, **Then** it appears in the assigned agent's queue
2. **Invalid input** — Given the request is missing a required field or contains invalid data, **When** it is submitted, **Then** the system returns a 400 error identifying the invalid field(s) and does not create a Ticket.
3. **Not found / conflict** — Given the parent resource referenced in the path does not exist, **When** the request is submitted, **Then** the system returns 404 and does not create a Ticket.
4. **Authorization** — Given the caller does not have permission to perform this action, **When** they call `POST /api/tickets/{id}/assign`, **Then** the system returns 401/403 and no Ticket is created.

## Functional Requirements

- **FR-07-1**: System MUST allow a(n) Supervisor to assign a ticket to an agent via `POST /api/tickets/{id}/assign`.
- **FR-07-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-07-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-07-4**: System MUST notify the newly assigned agent.
- **FR-07-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Ticket Management area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `assignedAgentId` | string (UUID) | Yes | Must reference an existing record. |

## Edge Cases

- **Concurrent assignment**: if two callers assign the same ticket to different agents at the same time, the database serializes the writes and the last write to commit wins — the ticket ends up assigned to a single agent, not both. A caller whose assignment "lost" sees the final (other) assignee when they re-fetch the ticket.
- **Downstream dependency unavailable**: the request fails fast with 503 and no partial state is persisted (the write is wrapped in a single transaction); the caller can safely retry.
- **In-progress state**: the action completes synchronously within one request/response cycle; the client shows a loading indicator until the response returns — there is no separate "in progress" state to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
