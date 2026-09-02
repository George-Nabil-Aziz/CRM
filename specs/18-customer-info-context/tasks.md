# Tasks: View customer information in context

**Plan**: ./plan.md

- [ ] T001 [Backend] Data model: add/extend `Customer` with fields: name, email, phone, recentTickets
- [ ] T002 [Backend] Validation: enforce the rules in spec.md's Data Fields table on `GET /api/tickets/{id}/context`
- [ ] T003 [Backend] Endpoint: implement `GET /api/tickets/{id}/context` per contracts/api.md (happy path)
- [ ] T004 [Backend] Error handling: implement the 400/401/403/404/409 responses from contracts/api.md
- [ ] T005 [Backend] Authorization: restrict this action to the correct role/permission
- [ ] T006 [Frontend] UI: let a(n) Agent see the customer's info while viewing a ticket, including validation error states
- [ ] T007 [Backend] Cache the customer summary for the duration of the ticket view.
- [ ] T008 [Test] Unit tests for validation and error responses (criteria 2-4 in spec.md)
- [ ] T009 [Test] Acceptance/integration test for the happy path (criterion 1 in spec.md)
- [ ] T010 [Docs] Confirm contracts/api.md matches the final implemented request/response shape
