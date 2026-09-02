# Feature Specification: AI ticket summaries

**Number**: 30
**Area**: AI Features
**Priority**: P3
**Status**: Draft

## User Story

As a(n) **Agent**, I want to **see an AI-generated summary of a long ticket thread**, so that **I can understand it quickly**.

## Description

This story covers the `GET /api/tickets/{id}/ai/summary` capability in the AI Features area. Send the ticket's message thread to an LLM summarization call and cache the result until new messages arrive.

## Acceptance Criteria

1. **Happy path** — **Given** a ticket with a long thread, **When** an agent opens it, **Then** an AI-generated summary is shown
2. **Invalid input** — Given the request omits a required parameter or supplies one in an invalid format, **When** it is submitted, **Then** the system returns a 400 error describing the problem.
3. **Not found / conflict** — Given the requested AiSummary does not exist (or, for a list, there are no matching records), **When** the request is made, **Then** the system returns 404 for a single lookup or an empty list for a collection — never a server error.
4. **Authorization** — Given the caller does not have permission to view this data, **When** they call `GET /api/tickets/{id}/ai/summary`, **Then** the system returns 401/403 and no data is returned.

## Functional Requirements

- **FR-30-1**: System MUST allow a(n) Agent to see an AI-generated summary of a long ticket thread via `GET /api/tickets/{id}/ai/summary`.
- **FR-30-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-30-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-30-4**: System MUST regenerate the summary automatically when new messages are added.
- **FR-30-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the AI Features area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `summaryText` | string | Yes | Must be provided and non-empty. |
| `generatedAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

## Edge Cases

- **Concurrent reads**: reads are not affected by concurrent writes to other records; a read that overlaps with a concurrent write to the same record returns either the pre- or post-write state consistently, never a mix of both.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
