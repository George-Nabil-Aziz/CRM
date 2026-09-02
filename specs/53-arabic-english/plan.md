# Implementation Plan: Arabic and English

**Spec**: ./spec.md
**Priority**: P4

## Approach

Externalize all UI strings into locale files (en/ar) and toggle the document direction attribute based on the selected locale.

## Data Model

- **N/A**: n/a

## API Surface

See `contracts/api.md` — `CLIENT UI locale switch plus Accept-Language header`

**Request**: locale=ar or locale=en
**Response**: UI re-renders in the selected language, RTL for Arabic

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for N/A with the fields listed in Data Fields.
2. Implement `CLIENT UI locale switch plus Accept-Language header` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) User switch the interface language.
5. Localize date/number formatting per locale, not just text.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: not applicable -- this is client-side behavior with no server-side authorization check.
- **Idempotency**: not applicable -- this is a client-side preference or rendering behavior, not a mutating server call.
