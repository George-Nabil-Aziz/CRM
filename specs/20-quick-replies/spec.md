# Feature Specification: Use quick replies

**Number**: 20
**Area**: Agent Dashboard
**Priority**: P2
**Status**: Draft

## User Story

As a(n) **Agent**, I want to **insert a quick-reply template into a response**, so that **I can respond faster to common questions**.

## Description

This story covers the `GET /api/quick-replies` capability in the Agent Dashboard area. Maintain a QuickReply table editable by admins; the compose box fetches and inserts the chosen template's body.

## Acceptance Criteria

1. **Happy path** — **Given** an open ticket, **When** an agent selects a quick-reply template, **Then** it is inserted into the response
2. **Invalid input** — Given the request omits a required parameter or supplies one in an invalid format, **When** it is submitted, **Then** the system returns a 400 error describing the problem.
3. **Not found / conflict** — Given the requested QuickReply does not exist (or, for a list, there are no matching records), **When** the request is made, **Then** the system returns 404 for a single lookup or an empty list for a collection — never a server error.
4. **Authorization** — Given the caller does not have permission to view this data, **When** they call `GET /api/quick-replies`, **Then** the system returns 401/403 and no data is returned.

## Functional Requirements

- **FR-20-1**: System MUST allow a(n) Agent to insert a quick-reply template into a response via `GET /api/quick-replies`.
- **FR-20-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-20-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-20-4**: System MUST support placeholder variables (e.g. customer name) in templates.
- **FR-20-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Agent Dashboard area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `title` | string | Yes | Must be provided and non-empty. |
| `body` | string | Yes | Must be provided and non-empty. |
| `category` | string (enum) | No | Optional filter; one of: `greeting`, `billing`, `technical`, `closing`, `escalation`. |

## Edge Cases

- **Concurrent reads**: reads are not affected by concurrent writes to other records; a read that overlaps with a concurrent write to the same record returns either the pre- or post-write state consistently, never a mix of both.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
