# Tasks: Arabic and English

**Plan**: ./plan.md

- [ ] T001 [Backend] Data model: add/extend `N/A` with fields: n/a
- [ ] T002 [Frontend] Validation: this story has no request/response payload to validate — only accept the two supported locale values (`ar`, `en`)
- [ ] T003 [Frontend] Implement: build the UI locale switch (plus `Accept-Language` header handling) per contracts/api.md's Notes (happy path) — this is client-side behavior, not an HTTP endpoint
- [ ] T004 [Frontend] Fallback handling: apply the default-locale fallback described in spec.md's Invalid input criterion — no HTTP status codes apply here (see contracts/api.md's Status Codes: N/A)
- [ ] T005 [Frontend] Persistence: ensure the user's chosen locale persists across reloads (see spec.md's Not found/conflict criterion)
- [ ] T006 [Frontend] UI: let a(n) User switch the interface language, including validation error states
- [ ] T007 [Backend] Localize date/number formatting per locale, not just text.
- [ ] T008 [Test] Unit tests for validation and error responses (criteria 2-4 in spec.md)
- [ ] T009 [Test] Acceptance/integration test for the happy path (criterion 1 in spec.md)
- [ ] T010 [Docs] Confirm contracts/api.md matches the final implemented request/response shape
