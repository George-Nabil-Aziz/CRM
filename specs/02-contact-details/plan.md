# Implementation Plan: Manage contact details

**Spec**: ./spec.md
**Priority**: P1

## Approach

Extend the customer-update endpoint to accept partial contact fields and re-validate them.

## Data Model

- **Customer**: phone, email, address

## API Surface

See `contracts/api.md` — `PATCH /api/customers/{id}`

**Request**: any subset of phone, email, address
**Response**: updated customer object

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Customer with the fields listed in Data Fields.
2. Implement `PATCH /api/customers/{id}` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Agent update a customer's contact details.
5. Log the change as a customer-history entry.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `customers:write` permission (any Agent, Supervisor, or Admin role).
- **Idempotency**: idempotent — a PATCH with the same body always produces the same resulting state, so it is safe to retry.
