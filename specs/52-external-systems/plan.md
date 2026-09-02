# Implementation Plan: External systems

**Spec**: ./spec.md
**Priority**: P4

## Approach

Let external systems subscribe to CRM events (ticket.created, ticket.updated, etc.) via outbound webhooks signed with a shared secret.

## Data Model

- **Webhook**: id, url, events, secret

## API Surface

See `contracts/api.md` — `POST /api/integrations/webhooks`

**Request**: target url, subscribed events
**Response**: created webhook subscription

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Webhook with the fields listed in Data Fields.
2. Implement `POST /api/integrations/webhooks` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Admin connect another external system.
5. Retry failed webhook deliveries with backoff.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `integrations:write` permission (Agent, Supervisor, or Admin role, as appropriate for Admins performing this action).
- **Idempotency**: not idempotent by default — each call creates a new Webhook. A caller that needs retry-safety should pass an `Idempotency-Key` header so a retried request returns the original record instead of creating a duplicate.
