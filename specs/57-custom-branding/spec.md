# Feature Specification: Custom branding

**Number**: 57
**Area**: Platform
**Priority**: P4
**Status**: Draft

## User Story

As a(n) **Admin**, I want to **configure custom branding**, so that **the portal matches our company identity**.

## Description

This story covers the `POST /api/settings/branding` capability in the Platform area. Store branding as a BrandingConfig record and have the portal/UI fetch and apply it at load time (CSS variables plus logo URL).

## Acceptance Criteria

1. **Happy path** — **Given** an admin has configured branding, **When** any user views the CRM/portal, **Then** the configured logo/colors are shown
2. **Invalid input** — Given the request is missing a required field or contains invalid data, **When** it is submitted, **Then** the system returns a 400 error identifying the invalid field(s) and does not create a BrandingConfig.
3. **Not found / conflict** — Given a BrandingConfig with the same unique identifier already exists, **When** the request is submitted again, **Then** the system returns 409 and does not create a duplicate BrandingConfig.
4. **Authorization** — Given the caller does not have permission to perform this action, **When** they call `POST /api/settings/branding`, **Then** the system returns 401/403 and no BrandingConfig is created.

## Functional Requirements

- **FR-57-1**: System MUST allow a(n) Admin to configure custom branding via `POST /api/settings/branding`.
- **FR-57-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-57-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-57-4**: System MUST fall back to default branding if no custom config is set.
- **FR-57-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Platform area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `logoUrl` | string (URL) | No | Must be a valid URL when present. |
| `primaryColor` | string | Yes | Must be provided and non-empty. |
| `secondaryColor` | string | Yes | Must be provided and non-empty. |

## Edge Cases

- **Concurrent creation**: each request creates an independent new BrandingConfig. If two requests would collide on a unique key, the database's unique constraint rejects the second one with 409; otherwise both succeed independently.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
