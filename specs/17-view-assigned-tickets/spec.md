# Feature Specification: View assigned tickets

**Number**: 17
**Area**: Agent Dashboard
**Priority**: P2
**Status**: Draft

## User Story

As a(n) **Agent**, I want to **see all tickets assigned to me**, so that **I know my workload at a glance**.

## Description

This story covers the `GET /api/agents/me/tickets` capability in the Agent Dashboard area. Query tickets by assignedAgentId, defaulting to open/pending statuses.

## Acceptance Criteria

1. **Happy path** — **Given** an agent has tickets assigned, **When** they open their dashboard, **Then** all assigned tickets are listed with status/priority
2. **Invalid input** — Given the request omits a required parameter or supplies one in an invalid format, **When** it is submitted, **Then** the system returns a 400 error describing the problem.
3. **Not found / conflict** — Given the requested Ticket does not exist (or, for a list, there are no matching records), **When** the request is made, **Then** the system returns 404 for a single lookup or an empty list for a collection — never a server error.
4. **Authorization** — Given the caller does not have permission to view this data, **When** they call `GET /api/agents/me/tickets`, **Then** the system returns 401/403 and no data is returned.

## Functional Requirements

- **FR-17-1**: System MUST allow a(n) Agent to see all tickets assigned to me via `GET /api/agents/me/tickets`.
- **FR-17-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-17-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-17-4**: System MUST support sorting by priority and SLA due time.
- **FR-17-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Agent Dashboard area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `subject` | string | Yes | Must be provided and non-empty. |
| `status` | string (enum) | No | Optional filter; one of: `open`, `pending`, `resolved`, `closed`. |
| `priority` | string (enum) | No | Optional filter; one of: `low`, `medium`, `high`, `urgent`. |
| `customerId` | string (UUID) | Yes | Must reference an existing record. |

## Edge Cases

- **Concurrent reads**: reads are not affected by concurrent writes to other records; a read that overlaps with a concurrent write to the same record returns either the pre- or post-write state consistently, never a mix of both.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
