# Tasks: Escalation rules

**Plan**: ./plan.md

- [ ] T001 [Backend] Data model: add/extend `Ticket` with fields: responseTargetAt, resolutionTargetAt, escalated
- [ ] T002 [Backend] Validation: enforce the rules in spec.md's Data Fields table on each ticket the `sla-monitor` job scans
- [ ] T003 [Backend] Job: implement the `sla-monitor` scheduled job per contracts/api.md (happy path) — this is a scheduled job, not an HTTP endpoint
- [ ] T004 [Backend] Error handling: on failure, log/alert per contracts/api.md's Notes rather than returning HTTP error codes — no HTTP status codes apply here (see contracts/api.md's Status Codes: N/A)
- [ ] T005 [Backend] Concurrency: ensure only one run executes at a time and an already-escalated ticket is not re-escalated (see spec.md's Invalid input criterion)
- [ ] T006 [Frontend] UI: let a(n) System auto-escalate a ticket when its SLA is breached, including validation error states
- [ ] T007 [Backend] Avoid re-escalating a ticket that is already escalated.
- [ ] T008 [Test] Unit tests for validation and error responses (criteria 2-4 in spec.md)
- [ ] T009 [Test] Acceptance/integration test for the happy path (criterion 1 in spec.md)
- [ ] T010 [Docs] Confirm contracts/api.md matches the final implemented request/response shape
