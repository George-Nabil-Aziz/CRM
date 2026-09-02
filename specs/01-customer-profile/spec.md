# Feature Specification: Create customer profile

**Number**: 01
**Area**: Customer Management
**Priority**: P1
**Status**: Draft

## User Story

As a(n) **Agent**, I want to **create a customer profile**, so that **I can start tracking their information and history**.

## Description

This story covers the `POST /api/customers` capability in the Customer Management area. Add a Customer table and a create-customer endpoint; validate email format server-side.

## Acceptance Criteria

1. **Happy path** — **Given** a new customer, **When** an agent creates a profile, **Then** it is saved and searchable
2. **Invalid input** — Given the request is missing a required field or contains invalid data, **When** it is submitted, **Then** the system returns a 400 error identifying the invalid field(s) and does not create a Customer.
3. **Not found / conflict** — Given a Customer with the same unique identifier already exists, **When** the request is submitted again, **Then** the system returns 409 and does not create a duplicate Customer.
4. **Authorization** — Given the caller does not have permission to perform this action, **When** they call `POST /api/customers`, **Then** the system returns 401/403 and no Customer is created.

## Functional Requirements

- **FR-01-1**: System MUST allow a(n) Agent to create a customer profile via `POST /api/customers`.
- **FR-01-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-01-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-01-4**: System MUST add a duplicate-email check before insert.
- **FR-01-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Customer Management area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `name` | string | Yes | Must be provided and non-empty. |
| `email` | string (email) | Yes | Must be a syntactically valid email address. |
| `phone` | string | Yes | Must be a valid phone number. |
| `createdAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

## Edge Cases

- **Concurrent creation**: if two requests would create a Customer with the same email at the same time, the database's unique constraint on `email` rejects the second one with 409 (see the Not found/conflict acceptance criterion); requests for genuinely different customers both succeed independently.
- **Downstream dependency unavailable**: the request fails fast with 503 and no partial state is persisted (the write is wrapped in a single transaction); the caller can safely retry.
- **In-progress state**: the action completes synchronously within one request/response cycle; the client shows a loading indicator until the response returns — there is no separate "in progress" state to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
