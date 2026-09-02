# Implementation Plan: Automatic categorization

**Spec**: ./spec.md
**Priority**: P3

## Approach

Run an LLM/classifier call on ticket creation and pre-fill the category field, which the agent can still override.

## Data Model

- **Ticket**: category, categoryConfidence

## API Surface

See `contracts/api.md` — `EVENT ticket.created AI classification step`

**Request**: none (runs on ticket creation)
**Response**: ticket stamped with a suggested category

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Ticket with the fields listed in Data Fields.
2. Implement `EVENT ticket.created AI classification step` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) System auto-suggest a category for a new ticket.
5. Log low-confidence classifications for periodic review.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: not applicable -- this is an internal event handler triggered by the system, not by an external caller.
- **Idempotency**: idempotent -- reprocessing the same ticket event is a no-op if the action was already applied.
