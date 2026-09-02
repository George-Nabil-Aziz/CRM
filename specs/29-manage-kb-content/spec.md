# Feature Specification: Manage knowledge base content

**Number**: 29
**Area**: Knowledge Base
**Priority**: P3
**Status**: Draft

## User Story

As a(n) **Admin**, I want to **create or edit a knowledge base article**, so that **information stays current**.

## Description

This story covers the `POST /api/kb/articles` capability in the Knowledge Base area. Restrict this endpoint to users with a content-management permission; re-index the article in search on save.

## Acceptance Criteria

1. **Happy path** — **Given** an admin/agent with permission, **When** they create or edit an article, **Then** the change is published and searchable
2. **Invalid input** — Given the request is missing a required field or contains invalid data, **When** it is submitted, **Then** the system returns a 400 error identifying the invalid field(s) and does not create a Article.
3. **Not found / conflict** — Given a Article with the same unique identifier already exists, **When** the request is submitted again, **Then** the system returns 409 and does not create a duplicate Article.
4. **Authorization** — Given the caller does not have permission to perform this action, **When** they call `POST /api/kb/articles`, **Then** the system returns 401/403 and no Article is created.

## Functional Requirements

- **FR-29-1**: System MUST allow a(n) Admin to create or edit a knowledge base article via `POST /api/kb/articles`.
- **FR-29-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-29-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-29-4**: System MUST support draft vs. published states so edits can be reviewed before going live.
- **FR-29-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Knowledge Base area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `title` | string | Yes | Must be provided and non-empty. |
| `body` | string | Yes | Must be provided and non-empty. |
| `category` | string (enum) | Yes | One of: `getting-started`, `billing`, `technical`, `account`, `general`. |
| `type` | string (enum) | Yes | One of: `faq`, `article`, `guide`. |
| `authorId` | string (UUID) | Yes | Must reference an existing record. |
| `publishedAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

## Edge Cases

- **Concurrent creation**: each request creates an independent new Article. If two requests would collide on a unique key, the database's unique constraint rejects the second one with 409; otherwise both succeed independently.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
