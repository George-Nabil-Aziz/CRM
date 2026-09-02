# Implementation Plan: Submit tickets via portal

**Spec**: ./spec.md
**Priority**: P3

## Approach

Reuse the core ticket-creation logic, scoped to the logged-in customer's id.

## Data Model

- **Ticket**: same fields as core ticket creation, scoped to the authenticated customer

## API Surface

See `contracts/api.md` — `POST /api/portal/tickets`

**Request**: subject, category, description
**Response**: created ticket visible in the customer's portal history

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Ticket with the fields listed in Data Fields.
2. Implement `POST /api/portal/tickets` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Customer submit a ticket through the portal.
5. Send the customer a confirmation email/SMS with the ticket number.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `portal:write` permission (Agent, Supervisor, or Admin role, as appropriate for Customers performing this action).
- **Idempotency**: not idempotent by default — each call creates a new Ticket. A caller that needs retry-safety should pass an `Idempotency-Key` header so a retried request returns the original record instead of creating a duplicate.
