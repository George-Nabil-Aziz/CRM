# Implementation Plan: ERP integration

**Spec**: ./spec.md
**Priority**: P4

## Approach

Pull customer/order records from the ERP's API on a schedule and upsert them into the Customer table, logging each sync.

## Data Model

- **ErpSyncLog**: id, entityType, externalId, status, syncedAt

## API Surface

See `contracts/api.md` — `JOB erp-sync scheduled job (or POST /api/integrations/erp/sync to trigger manually)`

**Request**: none (scheduled) or manual trigger
**Response**: sync run summary

## Dependencies

- Authentication/authorization layer (Security & Administration area) must be in place to enforce the Authorization acceptance criterion.
- Any parent/related entity referenced by this endpoint (see path parameters) must already be creatable before this story can be fully tested end-to-end.

## Steps

1. Design/extend the data model for ErpSyncLog with the fields listed in Data Fields.
2. Implement `JOB erp-sync scheduled job (or POST /api/integrations/erp/sync to trigger manually)` per contracts/api.md, including validation and the error responses listed in its Status Codes table.
3. Enforce authorization on the endpoint so only permitted callers can invoke it.
4. Build the UI/flow that lets a(n) Admin connect the CRM to the ERP system.
5. Alert an admin when a sync run fails.
6. Handle the edge cases listed in spec.md (concurrent writes, dependency failures, in-progress state).
7. Write automated tests covering all four acceptance criteria in spec.md.

## Permissions & Idempotency

- **Permission**: not applicable for the scheduled run -- no external caller to authorize. If this story exposes a manual-trigger endpoint, that endpoint requires an Admin role.
- **Idempotency**: idempotent per record -- a record already processed by a previous run is not reprocessed if the job is re-run after a partial failure.
