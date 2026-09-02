# Tasks: Alerts and notifications

**Plan**: ./plan.md

- [ ] T001 [Backend] Data model: add/extend `Notification` with fields: id, userId, ticketId, type, sentAt
- [ ] T002 [Backend] Validation: enforce the rules in spec.md's Data Fields table on the notification payload before it is dispatched
- [ ] T003 [Backend] Handler: implement the SLA-threshold notification dispatch per contracts/api.md (happy path) — this is an internal event handler, not an HTTP endpoint
- [ ] T004 [Backend] Error handling: on failure, log the error per contracts/api.md's Notes and retry delivery — no HTTP status codes apply here (see contracts/api.md's Status Codes: N/A)
- [ ] T005 [Backend] Idempotency: ensure the same SLA breach does not trigger duplicate notifications (see spec.md's Not found/conflict criterion)
- [ ] T006 [Frontend] UI: let a(n) Agent get alerted when an SLA deadline is approaching or breached, including validation error states
- [ ] T007 [Backend] Let each user configure which alert types they receive.
- [ ] T008 [Test] Unit tests for validation and error responses (criteria 2-4 in spec.md)
- [ ] T009 [Test] Acceptance/integration test for the happy path (criterion 1 in spec.md)
- [ ] T010 [Docs] Confirm contracts/api.md matches the final implemented request/response shape
