# Feature Specification: View customer information in context

**Number**: 18
**Area**: Agent Dashboard
**Priority**: P2
**Status**: Draft

## User Story

As a(n) **Agent**, I want to **see the customer's info while viewing a ticket**, so that **I have context without switching screens**.

## Description

This story covers the `GET /api/tickets/{id}/context` capability in the Agent Dashboard area. Compose the ticket-detail response with a joined customer summary rather than a separate round trip.

## Acceptance Criteria

1. **Happy path** — **Given** an agent opens a ticket, **When** they view it, **Then** the related customer's profile info is shown alongside it
2. **Invalid input** — Given the request omits a required parameter or supplies one in an invalid format, **When** it is submitted, **Then** the system returns a 400 error describing the problem.
3. **Not found / conflict** — Given the requested Customer does not exist (or, for a list, there are no matching records), **When** the request is made, **Then** the system returns 404 for a single lookup or an empty list for a collection — never a server error.
4. **Authorization** — Given the caller does not have permission to view this data, **When** they call `GET /api/tickets/{id}/context`, **Then** the system returns 401/403 and no data is returned.

## Functional Requirements

- **FR-18-1**: System MUST allow a(n) Agent to see the customer's info while viewing a ticket via `GET /api/tickets/{id}/context`.
- **FR-18-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-18-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-18-4**: System MUST cache the customer summary for the duration of the ticket view.
- **FR-18-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Agent Dashboard area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Must be provided and non-empty. |
| `email` | string (email) | Yes | Must be a syntactically valid email address. |
| `phone` | string | Yes | Must be a valid phone number. |
| `recentTickets` | string | Yes | Must be provided and non-empty. |

## Edge Cases

- **Concurrent reads**: reads are not affected by concurrent writes to other records; a read that overlaps with a concurrent write to the same record returns either the pre- or post-write state consistently, never a mix of both.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
