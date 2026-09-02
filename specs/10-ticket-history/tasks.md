# Tasks: View ticket history

**Plan**: ./plan.md

- [ ] T001 [Backend] Data model: add/extend `TicketEvent` with fields: id, ticketId, type, actorId, timestamp, details
- [ ] T002 [Backend] Validation: enforce the rules in spec.md's Data Fields table on `GET /api/tickets/{id}/history`
- [ ] T003 [Backend] Endpoint: implement `GET /api/tickets/{id}/history` per contracts/api.md (happy path)
- [ ] T004 [Backend] Error handling: implement the 400/401/403/404/409 responses from contracts/api.md
- [ ] T005 [Backend] Authorization: restrict this action to the correct role/permission
- [ ] T006 [Frontend] UI: let a(n) Agent view a ticket's full history, including validation error states
- [ ] T007 [Backend] Include channel messages inline in the same timeline.
- [ ] T008 [Test] Unit tests for validation and error responses (criteria 2-4 in spec.md)
- [ ] T009 [Test] Acceptance/integration test for the happy path (criterion 1 in spec.md)
- [ ] T010 [Docs] Confirm contracts/api.md matches the final implemented request/response shape
