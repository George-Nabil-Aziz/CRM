# Implementation Plan: AI chatbot

**Spec**: ./spec.md
**Priority**: P3

## Approach

Chatbot answers from the knowledge base first; if confidence is low or the customer asks for a human, hand off to a live-chat ticket.

## Data Model

- **ChatbotSession**: id, customerId, messages, handedOff

## API Surface

See `contracts/api.md` — `POST /api/chatbot/message`

**Request**: customer message text
**Response**: chatbot reply or handoff-to-agent signal

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for ChatbotSession with the fields listed in Data Fields.
2. Implement `POST /api/chatbot/message` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Customer get instant answers from a chatbot.
5. Log chatbot conversations as ticket history once handed off.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `chatbot:write` permission (Agent, Supervisor, or Admin role, as appropriate for Customers performing this action).
- **Idempotency**: not idempotent by default — each call creates a new ChatbotSession. A caller that needs retry-safety should pass an `Idempotency-Key` header so a retried request returns the original record instead of creating a duplicate.
