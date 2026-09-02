# Tasks: ERP integration

**Plan**: ./plan.md

- [ ] T001 [Backend] Data model: add/extend `ErpSyncLog` with fields: id, entityType, externalId, status, syncedAt
- [ ] T002 [Backend] Validation: enforce the rules in spec.md's Data Fields table on each record the `erp-sync` job pulls from the ERP
- [ ] T003 [Backend] Job: implement the `erp-sync` scheduled job (plus the optional manual-trigger endpoint `POST /api/integrations/erp/sync`, which does use standard HTTP status codes) per contracts/api.md
- [ ] T004 [Backend] Error handling: for the scheduled run, log/alert on failure per contracts/api.md's Notes (no HTTP status codes apply); for the manual-trigger endpoint, return the HTTP error codes listed in contracts/api.md
- [ ] T005 [Backend] Authorization: restrict the manual-trigger endpoint to the correct admin role/permission; the scheduled run itself has no external caller to authorize
- [ ] T006 [Frontend] UI: let a(n) Admin connect the CRM to the ERP system, including validation error states
- [ ] T007 [Backend] Alert an admin when a sync run fails.
- [ ] T008 [Test] Unit tests for validation and error responses (criteria 2-4 in spec.md)
- [ ] T009 [Test] Acceptance/integration test for the happy path (criterion 1 in spec.md)
- [ ] T010 [Docs] Confirm contracts/api.md matches the final implemented request/response shape
