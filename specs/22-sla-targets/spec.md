# Feature Specification: Response/resolution targets

**Number**: 22
**Area**: SLA & Automation
**Priority**: P2
**Status**: Draft

## User Story

As a(n) **Admin**, I want to **set response and resolution time targets per category**, so that **service quality is measurable**.

## Description

This story covers the `POST /api/sla-rules` capability in the SLA & Automation area. New tickets look up the matching SlaRule by category/priority and stamp response/resolution due timestamps on creation.

## Acceptance Criteria

1. **Happy path** — **Given** a ticket category, **When** an admin sets SLA response/resolution targets, **Then** every new ticket in that category inherits them
2. **Invalid input** — Given the request is missing a required field or contains invalid data, **When** it is submitted, **Then** the system returns a 400 error identifying the invalid field(s) and does not create a SlaRule.
3. **Not found / conflict** — Given a SlaRule with the same unique identifier already exists, **When** the request is submitted again, **Then** the system returns 409 and does not create a duplicate SlaRule.
4. **Authorization** — Given the caller does not have permission to perform this action, **When** they call `POST /api/sla-rules`, **Then** the system returns 401/403 and no SlaRule is created.

## Functional Requirements

- **FR-22-1**: System MUST allow a(n) Admin to set response and resolution time targets per category via `POST /api/sla-rules`.
- **FR-22-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-22-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-22-4**: System MUST allow editing an SLA rule without affecting already-created tickets.
- **FR-22-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the SLA & Automation area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `category` | string (enum) | Yes | Must be one of: `billing`, `technical`, `account`, `general`, `feature-request` (matches Ticket's category values). |
| `priority` | string (enum) | Yes | Must be one of: `low`, `medium`, `high`, `urgent` (matches Ticket's priority values). |
| `responseTargetMinutes` | string | Yes | Must be provided and non-empty. |
| `resolutionTargetMinutes` | string | Yes | Must be provided and non-empty. |

## Edge Cases

- **Concurrent creation**: each request creates an independent new SlaRule. If two requests would collide on a unique key, the database's unique constraint rejects the second one with 409; otherwise both succeed independently.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
