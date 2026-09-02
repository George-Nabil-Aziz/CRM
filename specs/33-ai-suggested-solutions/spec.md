# Feature Specification: AI suggested solutions

**Number**: 33
**Area**: AI Features
**Priority**: P3
**Status**: Draft

## User Story

As a(n) **Agent**, I want to **see suggested solutions from similar past tickets**, so that **resolution is faster**.

## Description

This story covers the `GET /api/tickets/{id}/ai/suggest-solutions` capability in the AI Features area. Use embedding similarity search over resolved tickets and knowledge-base articles to find and summarize matches.

## Acceptance Criteria

1. **Happy path** — **Given** a ticket similar to past resolved tickets, **When** an agent views it, **Then** relevant past solutions are suggested
2. **Invalid input** — Given the request omits a required parameter or supplies one in an invalid format, **When** it is submitted, **Then** the system returns a 400 error describing the problem.
3. **Not found / conflict** — Given the requested AiSuggestion does not exist (or, for a list, there are no matching records), **When** the request is made, **Then** the system returns 404 for a single lookup or an empty list for a collection — never a server error.
4. **Authorization** — Given the caller does not have permission to view this data, **When** they call `GET /api/tickets/{id}/ai/suggest-solutions`, **Then** the system returns 401/403 and no data is returned.

## Functional Requirements

- **FR-33-1**: System MUST allow a(n) Agent to see suggested solutions from similar past tickets via `GET /api/tickets/{id}/ai/suggest-solutions`.
- **FR-33-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-33-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-33-4**: System MUST let the agent mark a suggestion as helpful/not helpful to improve future ranking.
- **FR-33-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the AI Features area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `relatedTicketIds` | string | Yes | Must be provided and non-empty. |
| `suggestionText` | string | Yes | Must be provided and non-empty. |

## Edge Cases

- **Concurrent reads**: reads are not affected by concurrent writes to other records; a read that overlaps with a concurrent write to the same record returns either the pre- or post-write state consistently, never a mix of both.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
