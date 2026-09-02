# Feature Specification: Update ticket status

**Number**: 08
**Area**: Ticket Management
**Priority**: P1
**Status**: Draft

## User Story

As a(n) **Agent**, I want to **change a ticket's status**, so that **progress is visible to everyone**.

## Description

This story covers the `PATCH /api/tickets/{id}/status` capability in the Ticket Management area. Validate status transitions against the allowed state machine (no skipping from open to closed).

## Acceptance Criteria

1. **Happy path** — **Given** an open ticket, **When** an agent changes its status, **Then** the new status is reflected immediately
2. **Invalid input** — Given the request contains invalid data for one of the updatable fields, **When** it is submitted, **Then** the system returns a 400 error and leaves the existing Ticket unchanged.
3. **Not found / conflict** — Given the target Ticket does not exist, **When** the update is attempted, **Then** the system returns 404 and no other resource is affected.
4. **Authorization** — Given the caller does not have permission to modify this Ticket, **When** they call `PATCH /api/tickets/{id}/status`, **Then** the system returns 401/403 and the Ticket remains unchanged.

## Functional Requirements

- **FR-08-1**: System MUST allow a(n) Agent to change a ticket's status via `PATCH /api/tickets/{id}/status`.
- **FR-08-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-08-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-08-4**: System MUST record every status change in the ticket history log.
- **FR-08-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Ticket Management area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `status` | string (enum) | Yes | Must be one of: `open`, `pending`, `resolved`, `closed`, and must be a valid transition from the ticket's current status (`open`→`pending`/`resolved`; `pending`→`open`/`resolved`; `resolved`→`closed`/`open`; `closed` is terminal and requires re-opening via `open` before any other transition). |

## Edge Cases

- **Concurrent status changes**: the database applies updates in the order it receives them; the later write wins and becomes the ticket's final status. If the two concurrent requests set different, mutually-exclusive statuses, the second one persisted determines the outcome — no merge is attempted.
- **Downstream dependency unavailable**: the request fails fast with 503 and no partial state is persisted (the write is wrapped in a single transaction); the caller can safely retry.
- **In-progress state**: the action completes synchronously within one request/response cycle; the client shows a loading indicator until the response returns — there is no separate "in progress" state to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
