# Feature Specification: View history

**Number**: 37
**Area**: Customer Portal
**Priority**: P3
**Status**: Draft

## User Story

As a(n) **Customer**, I want to **view my past ticket history**, so that **I can reference previous issues**.

## Description

This story covers the `GET /api/portal/tickets` capability in the Customer Portal area. Filter the ticket list query by the authenticated customer's id.

## Acceptance Criteria

1. **Happy path** — **Given** a customer with past tickets, **When** they open the portal, **Then** their full ticket history is listed
2. **Invalid input** — Given the request omits a required parameter or supplies one in an invalid format, **When** it is submitted, **Then** the system returns a 400 error describing the problem.
3. **Not found / conflict** — Given the requested Ticket does not exist (or, for a list, there are no matching records), **When** the request is made, **Then** the system returns 404 for a single lookup or an empty list for a collection — never a server error.
4. **Authorization** — Given the caller does not have permission to view this data, **When** they call `GET /api/portal/tickets`, **Then** the system returns 401/403 and no data is returned.

## Functional Requirements

- **FR-37-1**: System MUST allow a(n) Customer to view my past ticket history via `GET /api/portal/tickets`.
- **FR-37-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-37-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-37-4**: System MUST support filtering the list by status or date range.
- **FR-37-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Customer Portal area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `subject` | string | Yes | Must be provided and non-empty. |
| `status` | string (enum) | No | Optional filter; one of: `open`, `pending`, `resolved`, `closed`. |
| `createdAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

## Edge Cases

- **Concurrent reads**: reads are not affected by concurrent writes to other records; a read that overlaps with a concurrent write to the same record returns either the pre- or post-write state consistently, never a mix of both.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
