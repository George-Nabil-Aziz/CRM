# Feature Specification: Contact via live chat

**Number**: 13
**Area**: Communication Channels
**Priority**: P2
**Status**: Draft

## User Story

As a(n) **Customer**, I want to **start a live chat**, so that **I get help in real time**.

## Description

This story covers the `WS /ws/chat` capability in the Communication Channels area. Use a WebSocket (or long-poll fallback) session per chat, backed by the same Message/Ticket tables as other channels.

## Acceptance Criteria

1. **Happy path** — **Given** a customer starts a live chat, **When** they send a message, **Then** a ticket/conversation is created and an agent can respond in real time
2. **Invalid input** — Given the chat session's connection drops mid-conversation, **When** the customer reconnects, **Then** prior messages are still visible and new messages continue the same ticket thread.
3. **Not found / conflict** — Given no agent is currently available, **When** a customer starts a chat, **Then** the customer sees a wait-time indicator or is offered to leave a ticket instead.
4. **Authorization** — Given the caller is not an authenticated customer or the assigned agent, **When** they attempt to open the connection, **Then** it is refused.

## Functional Requirements

- **FR-13-1**: System MUST allow a(n) Customer to start a live chat via `WS /ws/chat`.
- **FR-13-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-13-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-13-4**: System MUST show a customer-is-typing indicator to the agent.
- **FR-13-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Communication Channels area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `channel` | string (fixed) | No | Always set to `chat` by this handler; not caller-supplied. |
| `from` | string | Yes | Must be provided and non-empty. |
| `body` | string | Yes | Must be provided and non-empty. |
| `sentAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

## Edge Cases

- **Reconnection**: if the connection drops mid-conversation, the customer reconnecting sees prior messages in the session and new messages continue the same ticket thread rather than starting a new one.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
