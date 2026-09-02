# Feature Specification: AI suggested replies

**Number**: 31
**Area**: AI Features
**Priority**: P3
**Status**: Draft

## User Story

As a(n) **Agent**, I want to **get an AI-suggested reply**, so that **I can respond faster**.

## Description

This story covers the `POST /api/tickets/{id}/ai/suggest-reply` capability in the AI Features area. Prompt the LLM with the ticket thread plus relevant knowledge-base articles to ground the suggestion.

## Acceptance Criteria

1. **Happy path** — **Given** an open ticket, **When** an agent requests a suggestion, **Then** a contextually relevant reply is proposed
2. **Invalid input** — Given the request is missing a required field or contains invalid data, **When** it is submitted, **Then** the system returns a 400 error identifying the invalid field(s) and does not create a AiSuggestion.
3. **Not found / conflict** — Given the parent resource referenced in the path does not exist, **When** the request is submitted, **Then** the system returns 404 and does not create a AiSuggestion.
4. **Authorization** — Given the caller does not have permission to perform this action, **When** they call `POST /api/tickets/{id}/ai/suggest-reply`, **Then** the system returns 401/403 and no AiSuggestion is created.

## Functional Requirements

- **FR-31-1**: System MUST allow a(n) Agent to get an AI-suggested reply via `POST /api/tickets/{id}/ai/suggest-reply`.
- **FR-31-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-31-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-31-4**: System MUST let the agent edit the suggestion before sending; never send it automatically.
- **FR-31-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the AI Features area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `suggestedText` | string | Yes | Must be provided and non-empty. |

## Edge Cases

- **Concurrent submissions**: each AiSuggestion created by this call is its own independent record, so concurrent submissions never conflict with each other — both are saved independently.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
