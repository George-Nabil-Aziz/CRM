# Feature Specification: AI chatbot

**Number**: 34
**Area**: AI Features
**Priority**: P3
**Status**: Draft

## User Story

As a(n) **Customer**, I want to **get instant answers from a chatbot**, so that **I don't have to wait for a human agent**.

## Description

This story covers the `POST /api/chatbot/message` capability in the AI Features area. Chatbot answers from the knowledge base first; if confidence is low or the customer asks for a human, hand off to a live-chat ticket.

## Acceptance Criteria

1. **Happy path** — **Given** a customer with a question, **When** they interact with the chatbot, **Then** they get an instant answer or are handed off to a human agent
2. **Invalid input** — Given the request is missing a required field or contains invalid data, **When** it is submitted, **Then** the system returns a 400 error identifying the invalid field(s) and does not create a ChatbotSession.
3. **Not found / conflict** — Given a ChatbotSession with the same unique identifier already exists, **When** the request is submitted again, **Then** the system returns 409 and does not create a duplicate ChatbotSession.
4. **Authorization** — Given the caller does not have permission to perform this action, **When** they call `POST /api/chatbot/message`, **Then** the system returns 401/403 and no ChatbotSession is created.

## Functional Requirements

- **FR-34-1**: System MUST allow a(n) Customer to get instant answers from a chatbot via `POST /api/chatbot/message`.
- **FR-34-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-34-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-34-4**: System MUST log chatbot conversations as ticket history once handed off.
- **FR-34-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the AI Features area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `customerId` | string (UUID) | Yes | Must reference an existing record. |
| `messages` | string | Yes | Must be provided and non-empty. |
| `handedOff` | string | Yes | Must be provided and non-empty. |

## Edge Cases

- **Concurrent creation**: each request creates an independent new ChatbotSession. If two requests would collide on a unique key, the database's unique constraint rejects the second one with 409; otherwise both succeed independently.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
