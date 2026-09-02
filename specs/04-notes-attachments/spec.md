# Feature Specification: Add notes and attachments

**Number**: 04
**Area**: Customer Management
**Priority**: P1
**Status**: Draft

## User Story

As a(n) **Agent**, I want to **add a note or attachment to a customer profile**, so that **relevant details are preserved for future interactions**.

## Description

This story covers the `POST /api/customers/{id}/notes` capability in the Customer Management area. Store note text in the database and uploaded files in object storage, linked by customer id.

## Acceptance Criteria

1. **Happy path** — **Given** a customer profile, **When** an agent adds a note or attachment, **Then** it is saved and visible to any agent who opens the profile later
2. **Invalid input** — Given the request is missing a required field or contains invalid data, **When** it is submitted, **Then** the system returns a 400 error identifying the invalid field(s) and does not create a Note.
3. **Not found / conflict** — Given the parent resource referenced in the path does not exist, **When** the request is submitted, **Then** the system returns 404 and does not create a Note.
4. **Authorization** — Given the caller does not have permission to perform this action, **When** they call `POST /api/customers/{id}/notes`, **Then** the system returns 401/403 and no Note is created.

## Functional Requirements

- **FR-04-1**: System MUST allow a(n) Agent to add a note or attachment to a customer profile via `POST /api/customers/{id}/notes`.
- **FR-04-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-04-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-04-4**: System MUST enforce a file-size/type limit on attachments.
- **FR-04-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Customer Management area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `customerId` | string (UUID) | Yes | Must reference an existing record. |
| `authorId` | string (UUID) | Yes | Must reference an existing record. |
| `text` | string | Yes | Must be provided and non-empty. |
| `attachmentUrl` | string (URL) | No | Must be a valid URL when present. |
| `createdAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

## Edge Cases

- **Concurrent submissions**: each note/attachment is its own new record, so concurrent submissions never conflict with each other — both are saved independently, even if their text is identical.
- **Downstream dependency unavailable**: the request fails fast with 503 and no partial state is persisted (the note record and the uploaded file are only considered saved once both succeed); the caller can safely retry.
- **In-progress state**: for a text-only note, the action completes synchronously; for an attachment upload, the client shows an upload-progress indicator until the file finishes uploading and the note is confirmed saved.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
