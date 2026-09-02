# Feature Specification: Submit tickets via portal

**Number**: 35
**Area**: Customer Portal
**Priority**: P3
**Status**: Draft

## User Story

As a(n) **Customer**, I want to **submit a ticket through the portal**, so that **I don't need to email or call**.

## Description

This story covers the `POST /api/portal/tickets` capability in the Customer Portal area. Reuse the core ticket-creation logic, scoped to the logged-in customer's id.

## Acceptance Criteria

1. **Happy path** — **Given** a logged-in customer, **When** they submit a ticket through the portal, **Then** it is created and visible in their history
2. **Invalid input** — Given the request is missing a required field or contains invalid data, **When** it is submitted, **Then** the system returns a 400 error identifying the invalid field(s) and does not create a Ticket.
3. **Not found / conflict** — Given a Ticket with the same unique identifier already exists, **When** the request is submitted again, **Then** the system returns 409 and does not create a duplicate Ticket.
4. **Authorization** — Given the caller does not have permission to perform this action, **When** they call `POST /api/portal/tickets`, **Then** the system returns 401/403 and no Ticket is created.

## Functional Requirements

- **FR-35-1**: System MUST allow a(n) Customer to submit a ticket through the portal via `POST /api/portal/tickets`.
- **FR-35-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-35-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-35-4**: System MUST send the customer a confirmation email/SMS with the ticket number.
- **FR-35-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Customer Portal area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `same fields as core ticket creation` | string | Yes | Must be provided and non-empty. |
| `scoped to the authenticated customer` | string | Yes | Must be provided and non-empty. |

## Edge Cases

- **Concurrent creation**: each request creates an independent new Ticket. If two requests would collide on a unique key, the database's unique constraint rejects the second one with 409; otherwise both succeed independently.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
