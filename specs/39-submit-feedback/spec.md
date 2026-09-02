# Feature Specification: Submit feedback

**Number**: 39
**Area**: Customer Portal
**Priority**: P3
**Status**: Draft

## User Story

As a(n) **Customer**, I want to **submit feedback/rating after a ticket is resolved**, so that **I can express my satisfaction**.

## Description

This story covers the `POST /api/portal/tickets/{id}/feedback` capability in the Customer Portal area. Only allow feedback submission once a ticket reaches resolved/closed status, one submission per ticket.

## Acceptance Criteria

1. **Happy path** — **Given** a resolved ticket, **When** the customer submits feedback/rating, **Then** it is recorded against that ticket
2. **Invalid input** — Given the request is missing a required field or contains invalid data, **When** it is submitted, **Then** the system returns a 400 error identifying the invalid field(s) and does not create a Feedback.
3. **Not found / conflict** — Given the parent resource referenced in the path does not exist, **When** the request is submitted, **Then** the system returns 404 and does not create a Feedback.
4. **Authorization** — Given the caller does not have permission to perform this action, **When** they call `POST /api/portal/tickets/{id}/feedback`, **Then** the system returns 401/403 and no Feedback is created.

## Functional Requirements

- **FR-39-1**: System MUST allow a(n) Customer to submit feedback/rating after a ticket is resolved via `POST /api/portal/tickets/{id}/feedback`.
- **FR-39-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-39-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-39-4**: System MUST feed submitted ratings into the customer satisfaction report.
- **FR-39-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Customer Portal area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `rating` | integer | Yes | Must be an integer between 1 and 5. |
| `comment` | string | Yes | Must be provided and non-empty. |
| `submittedAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

## Edge Cases

- **Concurrent submissions**: each Feedback created by this call is its own independent record, so concurrent submissions never conflict with each other — both are saved independently.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
