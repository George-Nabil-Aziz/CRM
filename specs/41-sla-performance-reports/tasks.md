# Tasks: SLA performance reports

**Plan**: ./plan.md

- [ ] T001 [Backend] Data model: add/extend `Ticket` with fields: responseTargetAt, resolutionTargetAt, actualResponseAt, actualResolutionAt
- [ ] T002 [Backend] Validation: enforce the rules in spec.md's Data Fields table on `GET /api/reports/sla`
- [ ] T003 [Backend] Endpoint: implement `GET /api/reports/sla` per contracts/api.md (happy path)
- [ ] T004 [Backend] Error handling: implement the 400/401/403/404/409 responses from contracts/api.md
- [ ] T005 [Backend] Authorization: restrict this action to the correct role/permission
- [ ] T006 [Frontend] UI: let a(n) Manager view SLA compliance, including validation error states
- [ ] T007 [Backend] Break the compliance rate down by ticket priority.
- [ ] T008 [Test] Unit tests for validation and error responses (criteria 2-4 in spec.md)
- [ ] T009 [Test] Acceptance/integration test for the happy path (criterion 1 in spec.md)
- [ ] T010 [Docs] Confirm contracts/api.md matches the final implemented request/response shape
