# Feature Specification: Automatic categorization

**Number**: 32
**Area**: AI Features
**Priority**: P3
**Status**: Draft

## User Story

As a(n) **System**, I want to **auto-suggest a category for a new ticket**, so that **manual tagging is reduced**.

## Description

This story covers the `EVENT ticket.created AI classification step` capability in the AI Features area. Run an LLM/classifier call on ticket creation and pre-fill the category field, which the agent can still override.

## Acceptance Criteria

1. **Happy path** — **Given** a new ticket, **When** it is created, **Then** the system suggests/assigns a category automatically
2. **Invalid input** — Given no rule/condition matches the ticket, **When** the event fires, **Then** the ticket is left for manual handling and no error is raised.
3. **Not found / conflict** — Given the automation logic itself fails (e.g. an upstream AI service is unavailable), **When** it runs, **Then** the failure is logged and the ticket proceeds without the automated step rather than getting stuck.
4. **Authorization** — Given the same event fires twice for the same ticket, **When** it is processed, **Then** the action is not applied twice (idempotent).

## Functional Requirements

- **FR-32-1**: System MUST allow a(n) System to auto-suggest a category for a new ticket via `EVENT ticket.created AI classification step`.
- **FR-32-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-32-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-32-4**: System MUST log low-confidence classifications for periodic review.
- **FR-32-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the AI Features area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `category` | string (enum) | No | System-assigned; one of: `billing`, `technical`, `account`, `general`, `feature-request`. |
| `categoryConfidence` | number (0-1) | No | System-generated score, not caller-supplied. |

## Edge Cases

- **Repeated firing**: if the same event fires twice for the same ticket (e.g. a delivery retry), the handler is safe to run twice — the action is not applied a second time (see Idempotency below).
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
