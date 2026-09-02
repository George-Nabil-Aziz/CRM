# Implementation Plan: Response/resolution targets

**Spec**: ./spec.md
**Priority**: P2

## Approach

New tickets look up the matching SlaRule by category/priority and stamp response/resolution due timestamps on creation.

## Data Model

- **SlaRule**: id, category, priority, responseTargetMinutes, resolutionTargetMinutes

## API Surface

See `contracts/api.md` — `POST /api/sla-rules`

**Request**: category, priority, responseTargetMinutes, resolutionTargetMinutes
**Response**: created SLA rule

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for SlaRule with the fields listed in Data Fields.
2. Implement `POST /api/sla-rules` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Admin set response and resolution time targets per category.
5. Allow editing an SLA rule without affecting already-created tickets.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `sla-rules:write` permission (Agent, Supervisor, or Admin role, as appropriate for Admins performing this action).
- **Idempotency**: not idempotent by default — each call creates a new SlaRule. A caller that needs retry-safety should pass an `Idempotency-Key` header so a retried request returns the original record instead of creating a duplicate.
