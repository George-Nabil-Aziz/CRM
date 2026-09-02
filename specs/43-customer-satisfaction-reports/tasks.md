# Tasks: Customer satisfaction reports

**Plan**: ./plan.md

- [ ] T001 [Backend] Data model: add/extend `Feedback` with fields: rating, ticketId, submittedAt
- [ ] T002 [Backend] Validation: enforce the rules in spec.md's Data Fields table on `GET /api/reports/csat`
- [ ] T003 [Backend] Endpoint: implement `GET /api/reports/csat` per contracts/api.md (happy path)
- [ ] T004 [Backend] Error handling: implement the 400/401/403/404/409 responses from contracts/api.md
- [ ] T005 [Backend] Authorization: restrict this action to the correct role/permission
- [ ] T006 [Frontend] UI: let a(n) Manager view aggregated customer satisfaction, including validation error states
- [ ] T007 [Backend] Trend CSAT over time in weekly/monthly buckets.
- [ ] T008 [Test] Unit tests for validation and error responses (criteria 2-4 in spec.md)
- [ ] T009 [Test] Acceptance/integration test for the happy path (criterion 1 in spec.md)
- [ ] T010 [Docs] Confirm contracts/api.md matches the final implemented request/response shape
