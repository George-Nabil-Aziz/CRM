# Implementation Plan: AI ticket summaries

**Spec**: ./spec.md
**Priority**: P3

## Approach

Send the ticket's message thread to an LLM summarization call and cache the result until new messages arrive.

## Data Model

- **AiSummary**: ticketId, summaryText, generatedAt

## API Surface

See `contracts/api.md` — `GET /api/tickets/{id}/ai/summary`

**Request**: none
**Response**: generated summary text

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for AiSummary with the fields listed in Data Fields.
2. Implement `GET /api/tickets/{id}/ai/summary` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Agent see an AI-generated summary of a long ticket thread.
5. Regenerate the summary automatically when new messages are added.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `tickets:read` permission (Agent, Supervisor, or Admin role, as appropriate for Agents performing this action).
- **Idempotency**: idempotent — this is a read-only GET, safe to call any number of times.
