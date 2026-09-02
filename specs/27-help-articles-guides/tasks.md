# Tasks: Read help articles and guides

**Plan**: ./plan.md

- [ ] T001 [Backend] Data model: add/extend `Article` with fields: id, title, body, category, type
- [ ] T002 [Backend] Validation: enforce the rules in spec.md's Data Fields table on `GET /api/kb/articles/{id}`
- [ ] T003 [Backend] Endpoint: implement `GET /api/kb/articles/{id}` per contracts/api.md (happy path)
- [ ] T004 [Backend] Error handling: implement the 400/401/403/404/409 responses from contracts/api.md
- [ ] T005 [Backend] Authorization: restrict this action to the correct role/permission
- [ ] T006 [Frontend] UI: let a(n) Customer read a help article or guide, including validation error states
- [ ] T007 [Backend] Show related articles at the bottom of each article.
- [ ] T008 [Test] Unit tests for validation and error responses (criteria 2-4 in spec.md)
- [ ] T009 [Test] Acceptance/integration test for the happy path (criterion 1 in spec.md)
- [ ] T010 [Docs] Confirm contracts/api.md matches the final implemented request/response shape
