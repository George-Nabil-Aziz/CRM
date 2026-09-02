# Implementation Plan: Create customer profile

**Spec**: ./spec.md
**Priority**: P1

## Approach

Add a Customer table and a create-customer endpoint; validate email format server-side.

## Data Model

- **Customer**: id, name, email, phone, createdAt

## API Surface

See `contracts/api.md` — `POST /api/customers`

**Request**: name, email, phone
**Response**: customer id, name, email, phone, createdAt

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Customer with the fields listed in Data Fields.
2. Implement `POST /api/customers` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Agent create a customer profile.
5. Add a duplicate-email check before insert.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `customers:write` permission (any Agent, Supervisor, or Admin role).
- **Idempotency**: not idempotent by default — a repeated call with the same email is rejected with 409 rather than creating a duplicate customer (enforced by the unique constraint on `email`). Callers that need a true retry-safe create should be able to pass an `Idempotency-Key` header so a retried request returns the original customer instead of a 409.
