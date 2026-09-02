# Tasks: Multi-branch

**Plan**: ./plan.md

- [ ] T001 [Backend] Data model: add/extend `Branch` with fields: id, name, location
- [ ] T002 [Backend] Validation: enforce the rules in spec.md's Data Fields table on `POST /api/branches`
- [ ] T003 [Backend] Endpoint: implement `POST /api/branches` per contracts/api.md (happy path)
- [ ] T004 [Backend] Error handling: implement the 400/401/403/404/409 responses from contracts/api.md
- [ ] T005 [Backend] Authorization: restrict this action to the correct role/permission
- [ ] T006 [Frontend] UI: let a(n) Admin scope tickets/customers to branches, including validation error states
- [ ] T007 [Backend] Report on ticket volume per branch.
- [ ] T008 [Test] Unit tests for validation and error responses (criteria 2-4 in spec.md)
- [ ] T009 [Test] Acceptance/integration test for the happy path (criterion 1 in spec.md)
- [ ] T010 [Docs] Confirm contracts/api.md matches the final implemented request/response shape
