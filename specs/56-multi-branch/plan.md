# Implementation Plan: Multi-branch

**Spec**: ./spec.md
**Priority**: P4

## Approach

Add a branchId foreign key to Ticket and Customer, following the same scoping pattern as multi-department.

## Data Model

- **Branch**: id, name, location

## API Surface

See `contracts/api.md` — `POST /api/branches`

**Request**: name, location
**Response**: created branch

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Branch with the fields listed in Data Fields.
2. Implement `POST /api/branches` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Admin scope tickets/customers to branches.
5. Report on ticket volume per branch.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `branches:write` permission (Agent, Supervisor, or Admin role, as appropriate for Admins performing this action).
- **Idempotency**: not idempotent by default — each call creates a new Branch. A caller that needs retry-safety should pass an `Idempotency-Key` header so a retried request returns the original record instead of creating a duplicate.
