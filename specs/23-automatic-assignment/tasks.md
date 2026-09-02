# Tasks: Automatic assignment

**Plan**: ./plan.md

- [ ] T001 [Backend] Data model: add/extend `AssignmentRule` with fields: id, condition, targetAgentOrTeam
- [ ] T002 [Backend] Validation: enforce the rules in spec.md's Data Fields table on the event payload before the `ticket.created` handler acts on it
- [ ] T003 [Backend] Handler: implement the `ticket.created` event handler per contracts/api.md (happy path) — this is an internal event handler, not an HTTP endpoint
- [ ] T004 [Backend] Error handling: on failure, log the error per contracts/api.md's Notes and leave the ticket for manual assignment — no HTTP status codes apply here (see contracts/api.md's Status Codes: N/A)
- [ ] T005 [Backend] Idempotency: ensure the handler is safe to run twice for the same ticket without assigning it twice (see spec.md's Not found/conflict criterion)
- [ ] T006 [Frontend] UI: let a(n) System auto-assign a new ticket based on rules, including validation error states
- [ ] T007 [Backend] Support round-robin assignment within a team when multiple agents match.
- [ ] T008 [Test] Unit tests for validation and error responses (criteria 2-4 in spec.md)
- [ ] T009 [Test] Acceptance/integration test for the happy path (criterion 1 in spec.md)
- [ ] T010 [Docs] Confirm contracts/api.md matches the final implemented request/response shape
