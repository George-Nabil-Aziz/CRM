# Feature Specification: Categories and priorities

**Number**: 06
**Area**: Ticket Management
**Priority**: P1
**Status**: Draft

## User Story

As a(n) **Agent**, I want to **set a ticket's category and priority**, so that **it's tagged and filterable correctly**.

## Description

This story covers the `PATCH /api/tickets/{id}` capability in the Ticket Management area. Reuse a fixed lookup table of categories/priorities so values stay consistent across the system.

## Acceptance Criteria

1. **Happy path** — **Given** a new ticket, **When** an agent sets a category and priority, **Then** the ticket is tagged accordingly and filterable by both
2. **Invalid input** — Given the request contains invalid data for one of the updatable fields, **When** it is submitted, **Then** the system returns a 400 error and leaves the existing Ticket unchanged.
3. **Not found / conflict** — Given the target Ticket does not exist, **When** the update is attempted, **Then** the system returns 404 and no other resource is affected.
4. **Authorization** — Given the caller does not have permission to modify this Ticket, **When** they call `PATCH /api/tickets/{id}`, **Then** the system returns 401/403 and the Ticket remains unchanged.

## Functional Requirements

- **FR-06-1**: System MUST allow a(n) Agent to set a ticket's category and priority via `PATCH /api/tickets/{id}`.
- **FR-06-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-06-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-06-4**: System MUST reject unknown category/priority values with a 400.
- **FR-06-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Ticket Management area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `category` | string (enum) | Yes | Must be one of: `billing`, `technical`, `account`, `general`, `feature-request`. |
| `priority` | string (enum) | Yes | Must be one of: `low`, `medium`, `high`, `urgent`. |

## Edge Cases

- **Concurrent updates**: the database applies updates in the order it receives them; the later write wins. If one caller sets category and another sets priority at the same moment, both changes are kept (they touch different fields) since this is a partial update.
- **Downstream dependency unavailable**: the request fails fast with 503 and no partial state is persisted (the write is wrapped in a single transaction); the caller can safely retry.
- **In-progress state**: the action completes synchronously within one request/response cycle; the client shows a loading indicator until the response returns — there is no separate "in progress" state to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
