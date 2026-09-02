# Tasks: Manage users and roles

**Plan**: ./plan.md

- [ ] T001 [Backend] Data model: add/extend `User` with fields: id, name, email, roleId
- [ ] T002 [Backend] Validation: enforce the rules in spec.md's Data Fields table on `POST /api/users`
- [ ] T003 [Backend] Endpoint: implement `POST /api/users` per contracts/api.md (happy path)
- [ ] T004 [Backend] Error handling: implement the 400/401/403/404/409 responses from contracts/api.md
- [ ] T005 [Backend] Authorization: restrict this action to the correct role/permission
- [ ] T006 [Frontend] UI: let a(n) Admin create a user and assign a role, including validation error states
- [ ] T007 [Backend] Prevent creating a user with a duplicate email.
- [ ] T008 [Test] Unit tests for validation and error responses (criteria 2-4 in spec.md)
- [ ] T009 [Test] Acceptance/integration test for the happy path (criterion 1 in spec.md)
- [ ] T010 [Docs] Confirm contracts/api.md matches the final implemented request/response shape
