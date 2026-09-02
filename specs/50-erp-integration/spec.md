# Feature Specification: ERP integration

**Number**: 50
**Area**: Integrations
**Priority**: P4
**Status**: Draft

## User Story

As a(n) **Admin**, I want to **connect the CRM to the ERP system**, so that **customer/order data stays synced**.

## Description

This story covers the `JOB erp-sync scheduled job (or POST /api/integrations/erp/sync to trigger manually)` capability in the Integrations area. Pull customer/order records from the ERP's API on a schedule and upsert them into the Customer table, logging each sync.

## Acceptance Criteria

1. **Happy path** — **Given** an ERP connection is configured, **When** customer/order data changes in the ERP, **Then** the CRM reflects the update
2. **Invalid input** — Given a scheduled run overlaps with a previous run still in progress, **When** it fires, **Then** only one run executes at a time (no duplicate processing).
3. **Not found / conflict** — Given the job fails partway through, **When** it errors, **Then** already-processed records are not reprocessed on the next run, and the failure is logged/alerted.
4. **Authorization** — Given the external system involved is unreachable, **When** the job runs, **Then** it retries with backoff and does not lose data.

## Functional Requirements

- **FR-50-1**: System MUST allow a(n) Admin to connect the CRM to the ERP system via `JOB erp-sync scheduled job (or POST /api/integrations/erp/sync to trigger manually)`.
- **FR-50-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-50-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-50-4**: System MUST alert an admin when a sync run fails.
- **FR-50-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Integrations area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `entityType` | string (enum) | Yes | One of: `customer`, `order`. |
| `externalId` | string (UUID) | Yes | Must reference an existing record. |
| `status` | string (enum) | No | One of: `success`, `failed`, `in_progress`. Defaults to `in_progress` while the sync is running. |
| `syncedAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

## Edge Cases

- **Overlapping runs**: if a scheduled run is still in progress when the next one would start, only one run executes at a time — the overlapping run is skipped or queued, never processed concurrently.
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
