# Implementation Plan: AI suggested replies

**Spec**: ./spec.md
**Priority**: P3

## Approach

Prompt the LLM with the ticket thread plus relevant knowledge-base articles to ground the suggestion.

## Data Model

- **AiSuggestion**: ticketId, suggestedText

## API Surface

See `contracts/api.md` — `POST /api/tickets/{id}/ai/suggest-reply`

**Request**: none (uses ticket context)
**Response**: suggested reply text

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for AiSuggestion with the fields listed in Data Fields.
2. Implement `POST /api/tickets/{id}/ai/suggest-reply` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Agent get an AI-suggested reply.
5. Let the agent edit the suggestion before sending; never send it automatically.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `tickets:write` permission (Agent, Supervisor, or Admin role, as appropriate for Agents performing this action).
- **Idempotency**: not idempotent by default — each call creates a new AiSuggestion. A caller that needs retry-safety should pass an `Idempotency-Key` header.
