# Implementation Plan: AI suggested solutions

**Spec**: ./spec.md
**Priority**: P3

## Approach

Use embedding similarity search over resolved tickets and knowledge-base articles to find and summarize matches.

## Data Model

- **AiSuggestion**: ticketId, relatedTicketIds, suggestionText

## API Surface

See `contracts/api.md` — `GET /api/tickets/{id}/ai/suggest-solutions`

**Request**: none
**Response**: list of similar resolved tickets/solutions

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for AiSuggestion with the fields listed in Data Fields.
2. Implement `GET /api/tickets/{id}/ai/suggest-solutions` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Agent see suggested solutions from similar past tickets.
5. Let the agent mark a suggestion as helpful/not helpful to improve future ranking.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `tickets:read` permission (Agent, Supervisor, or Admin role, as appropriate for Agents performing this action).
- **Idempotency**: idempotent — this is a read-only GET, safe to call any number of times.
