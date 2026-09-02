# Feature Specification: Escalation rules

**Number**: 24
**Area**: SLA & Automation
**Priority**: P2
**Status**: Draft

## User Story

As a(n) **System**, I want to **auto-escalate a ticket when its SLA is breached**, so that **issues get attention without being missed**.

## Description

This story covers the `JOB sla-monitor scheduled job` capability in the SLA & Automation area. Run a periodic job that scans tickets past their SLA due timestamp and calls the same escalate endpoint agents use.

## Acceptance Criteria

1. **Happy path** — **Given** an SLA target is breached, **When** the breach occurs, **Then** the ticket auto-escalates per the configured rule
2. **Invalid input** — Given a scheduled run overlaps with a previous run still in progress, **When** it fires, **Then** only one run executes at a time (no duplicate processing).
3. **Not found / conflict** — Given the job fails partway through, **When** it errors, **Then** already-processed records are not reprocessed on the next run, and the failure is logged/alerted.
4. **Authorization** — Given the external system involved is unreachable, **When** the job runs, **Then** it retries with backoff and does not lose data.

## Functional Requirements

- **FR-24-1**: System MUST allow a(n) System to auto-escalate a ticket when its SLA is breached via `JOB sla-monitor scheduled job`.
- **FR-24-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-24-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-24-4**: System MUST avoid re-escalating a ticket that is already escalated.
- **FR-24-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the SLA & Automation area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `responseTargetAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |
| `resolutionTargetAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |
| `escalated` | string | Yes | Must be provided and non-empty. |

## Edge Cases

- **Overlapping runs**: if a scheduled run is still in progress when the next one would start, only one run executes at a time — the overlapping run is skipped or queued, never processed concurrently.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
