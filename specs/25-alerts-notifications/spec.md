# Feature Specification: Alerts and notifications

**Number**: 25
**Area**: SLA & Automation
**Priority**: P2
**Status**: Draft

## User Story

As a(n) **Agent**, I want to **get alerted when an SLA deadline is approaching or breached**, so that **I can act before it's too late**.

## Description

This story covers the `EVENT notification dispatch on SLA threshold` capability in the SLA & Automation area. Reuse a generic Notification table/dispatcher so SLA alerts, mentions, and reminders share one delivery mechanism.

## Acceptance Criteria

1. **Happy path** — **Given** an SLA deadline is approaching or breached, **When** the threshold is crossed, **Then** the responsible agent/supervisor is alerted
2. **Invalid input** — Given no rule/condition matches the ticket, **When** the event fires, **Then** the ticket is left for manual handling and no error is raised.
3. **Not found / conflict** — Given the automation logic itself fails (e.g. an upstream AI service is unavailable), **When** it runs, **Then** the failure is logged and the ticket proceeds without the automated step rather than getting stuck.
4. **Authorization** — Given the same event fires twice for the same ticket, **When** it is processed, **Then** the action is not applied twice (idempotent).

## Functional Requirements

- **FR-25-1**: System MUST allow a(n) Agent to get alerted when an SLA deadline is approaching or breached via `EVENT notification dispatch on SLA threshold`.
- **FR-25-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-25-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-25-4**: System MUST let each user configure which alert types they receive.
- **FR-25-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the SLA & Automation area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `userId` | string (UUID) | Yes | Must reference an existing record. |
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `type` | string (enum) | Yes | Must be one of: `sla_breach`, `sla_warning`, `mention`, `reminder`, `assignment`. |
| `sentAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

## Edge Cases

- **Repeated firing**: if the same event fires twice for the same ticket (e.g. a delivery retry), the handler is safe to run twice — the action is not applied a second time (see Idempotency below).
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
