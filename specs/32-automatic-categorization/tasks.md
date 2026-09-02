# Tasks: Automatic categorization

**Plan**: ./plan.md

- [ ] T001 [Backend] Data model: add/extend `Ticket` with fields: category, categoryConfidence
- [ ] T002 [Backend] Validation: enforce the rules in spec.md's Data Fields table on the classifier's output before it is stamped on the ticket
- [ ] T003 [Backend] Handler: implement the `ticket.created` AI classification step per contracts/api.md (happy path) — this is an internal event handler, not an HTTP endpoint
- [ ] T004 [Backend] Error handling: on failure (e.g. classifier unavailable), log the error per contracts/api.md's Notes and leave the ticket uncategorized rather than blocking creation — no HTTP status codes apply here (see contracts/api.md's Status Codes: N/A)
- [ ] T005 [Backend] Idempotency: ensure the handler is safe to run twice for the same ticket without double-stamping a category (see spec.md's Not found/conflict criterion)
- [ ] T006 [Frontend] UI: let a(n) System auto-suggest a category for a new ticket, including validation error states
- [ ] T007 [Backend] Log low-confidence classifications for periodic review.
- [ ] T008 [Test] Unit tests for validation and error responses (criteria 2-4 in spec.md)
- [ ] T009 [Test] Acceptance/integration test for the happy path (criterion 1 in spec.md)
- [ ] T010 [Docs] Confirm contracts/api.md matches the final implemented request/response shape
