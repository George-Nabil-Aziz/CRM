# Implementation Plan: Email, SMS and WhatsApp integration

**Spec**: ./spec.md
**Priority**: P4

## Approach

Store provider credentials encrypted at rest and validate them with a test call before marking the channel active.

## Data Model

- **ChannelConfig**: id, channel, credentials, status

## API Surface

See `contracts/api.md` — `POST /api/integrations/channels`

**Request**: channel type plus provider credentials
**Response**: saved and validated channel configuration

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for ChannelConfig with the fields listed in Data Fields.
2. Implement `POST /api/integrations/channels` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Admin configure the email/SMS/WhatsApp provider credentials.
5. Show connection health status for each configured channel.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `integrations:write` permission (Agent, Supervisor, or Admin role, as appropriate for Admins performing this action).
- **Idempotency**: not idempotent by default — each call creates a new ChannelConfig. A caller that needs retry-safety should pass an `Idempotency-Key` header so a retried request returns the original record instead of creating a duplicate.
