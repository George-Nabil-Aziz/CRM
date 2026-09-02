# Feature Specification: Manage contact details

**Number**: 02
**Area**: Customer Management
**Priority**: P1
**Status**: Draft

## User Story

As a(n) **Agent**, I want to **update a customer's contact details**, so that **outreach always reaches them on the right channel**.

## Description

This story covers the `PATCH /api/customers/{id}` capability in the Customer Management area. Extend the customer-update endpoint to accept partial contact fields and re-validate them.

## Acceptance Criteria

1. **Happy path** — **Given** a customer profile, **When** an agent adds/edits phone, email, or address, **Then** the updated details are saved and used for outreach
2. **Invalid input** — Given the request contains invalid data for one of the updatable fields, **When** it is submitted, **Then** the system returns a 400 error and leaves the existing Customer unchanged.
3. **Not found / conflict** — Given the target Customer does not exist, **When** the update is attempted, **Then** the system returns 404 and no other resource is affected.
4. **Authorization** — Given the caller does not have permission to modify this Customer, **When** they call `PATCH /api/customers/{id}`, **Then** the system returns 401/403 and the Customer remains unchanged.

## Functional Requirements

- **FR-02-1**: System MUST allow a(n) Agent to update a customer's contact details via `PATCH /api/customers/{id}`.
- **FR-02-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-02-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-02-4**: System MUST log the change as a customer-history entry.
- **FR-02-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Customer Management area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `phone` | string | Yes | Must be a valid phone number. |
| `email` | string (email) | Yes | Must be a syntactically valid email address. |
| `address` | string | Yes | Must be provided and non-empty. |

## Edge Cases

- **Concurrent updates**: the database applies updates in the order it receives them (row-level locking); the later write wins and the response always reflects the final persisted state. There is no optimistic locking in v1, so a caller may unknowingly overwrite another caller's concurrent change to a different field.
- **Downstream dependency unavailable**: the request fails fast with 503 and no partial state is persisted (the write is wrapped in a single transaction); the caller can safely retry.
- **In-progress state**: the action completes synchronously within one request/response cycle; the client shows a loading indicator until the response returns — there is no separate "in progress" state to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
