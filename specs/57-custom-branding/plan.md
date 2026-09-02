# Implementation Plan: Custom branding

**Spec**: ./spec.md
**Priority**: P4

## Approach

Store branding as a BrandingConfig record and have the portal/UI fetch and apply it at load time (CSS variables plus logo URL).

## Data Model

- **BrandingConfig**: logoUrl, primaryColor, secondaryColor

## API Surface

See `contracts/api.md` — `POST /api/settings/branding`

**Request**: logo file upload, color values
**Response**: saved branding configuration

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for BrandingConfig with the fields listed in Data Fields.
2. Implement `POST /api/settings/branding` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Admin configure custom branding.
5. Fall back to default branding if no custom config is set.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: requires the `settings:write` permission (Agent, Supervisor, or Admin role, as appropriate for Admins performing this action).
- **Idempotency**: not idempotent by default — each call creates a new BrandingConfig. A caller that needs retry-safety should pass an `Idempotency-Key` header so a retried request returns the original record instead of creating a duplicate.
