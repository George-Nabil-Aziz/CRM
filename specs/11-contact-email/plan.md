# Implementation Plan: Contact via email

**Spec**: ./spec.md
**Priority**: P2

## Approach

Connect an inbound-email webhook that maps sender address to a customer and creates/updates a ticket.

## Data Model

- **Message**: id, ticketId, channel=email, from, body, receivedAt

## API Surface

See `contracts/api.md` — `POST /api/channels/email/inbound`

**Request**: raw inbound email payload from provider webhook
**Response**: 202 accepted, ticket id

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for Message with the fields listed in Data Fields.
2. Implement `POST /api/channels/email/inbound` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Customer email support about an issue.
5. Thread replies to the same ticket via a Message-ID reference header.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: not applicable for this handler -- the caller is the messaging provider, authenticated via signature or token verification (see contracts/api.md), not a staff role.
- **Idempotency**: not idempotent by default (each inbound message is a new event); safe redelivery is achieved via the provider's delivery-ID dedup check described above, not a client-supplied idempotency key.
