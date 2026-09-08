# UI Tests — CRM

The Angular front end is six standalone components on six routes
([`app.routes.ts`](../frontend/src/app/app.routes.ts)). Shared API access lives in
`api.service.ts`, shared types in `models.ts`.

Run each case at **1440 px** unless stated. Responsive behaviour has its own file —
[`test-cases/54-web-mobile-friendly/`](test-cases/54-web-mobile-friendly/test-cases.md).

| Route | Component | Backs onto |
|---|---|---|
| `/` | [`dashboard.page.ts`](../frontend/src/app/pages/dashboard.page.ts) | `/api/reports/dashboard` |
| `/customers` | [`customers.page.ts`](../frontend/src/app/pages/customers.page.ts) | `/api/customers` |
| `/customers/:id` | [`customer-detail.page.ts`](../frontend/src/app/pages/customer-detail.page.ts) | customer, history, notes |
| `/tickets` | [`tickets.page.ts`](../frontend/src/app/pages/tickets.page.ts) | `/api/tickets`, `/api/customers` |
| `/tickets/:id` | [`ticket-detail.page.ts`](../frontend/src/app/pages/ticket-detail.page.ts) | ticket, context, messages, history, AI |
| `/knowledge-base` | [`knowledge-base.page.ts`](../frontend/src/app/pages/knowledge-base.page.ts) | KB search, chatbot |

**Before starting**: the API allows only `http://localhost:4200` and `http://localhost:4300`. If
every call fails at once, check the origin before raising a defect (GAP-162).

---

## Dashboard — `/`

| ID | Title | Type | Pri | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|
| UI-DSH-001 | The dashboard renders all sections | Positive | P2 | `SEED-BASE` with SLA rules, assignments and feedback | 1. Open `/`. | Three tables render — tickets by status, SLA performance, agent performance — plus the CSAT figures. Values match `GET /api/reports/dashboard`. | Not Run |
| UI-DSH-002 | Empty state on a fresh system | Edge | P2 | `SEED-EMPTY` | 1. Open `/`. | Empty sections render cleanly — no bare table headers, no spinner that never resolves, no error. See TC-44-006. | Not Run |
| UI-DSH-003 | The tickets link navigates | Positive | P2 | `SEED-BASE` | 1. Click the tickets link. | Navigates to `/tickets`. | Not Run |
| UI-DSH-004 | A failed API call surfaces an error | Negative | P2 | API stopped | 1. Open `/`. | A visible error message. The page must not hang on a spinner or show a blank white screen. | Not Run |
| UI-DSH-005 | Zero-count statuses are absent | Edge | P3 | Tickets in only two statuses | 1. Open `/`. | Only those two rows appear — the API omits empty groups (GAP-122). Confirm the UI does not imply the others are zero when they are simply missing. | Not Run |

## Customers — `/customers`

| ID | Title | Type | Pri | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|
| UI-CUS-001 | The customer list renders | Positive | P1 | `SEED-BASE` | 1. Open `/customers`. | A table of customers, newest first. | Not Run |
| UI-CUS-002 | Create a customer | Positive | P1 | `SEED-EMPTY` | 1. Fill name, email and phone.<br>2. Submit. | The customer is created and appears in the table without a manual refresh. | Not Run |
| UI-CUS-003 | Field-level validation is shown | Negative | P1 | API running | 1. Submit with an empty name.<br>2. Submit with a malformed email. | The offending input is marked with the `invalid` class and the message identifies the field. The component tracks `fieldErrors` per field — confirm it clears on correction. | Not Run |
| UI-CUS-004 | A duplicate email is reported | Negative | P1 | A customer with that email exists | 1. Submit the same email again. | The `409` message is shown to the user, not swallowed. Confirm it reads as a conflict, not a generic failure. | Not Run |
| UI-CUS-005 | The submit button guards against double submission | Edge | P2 | API running | 1. Click submit twice rapidly. | The button disables while `creating` is true, so only one customer is created. | Not Run |
| UI-CUS-006 | Search filters the list | Positive | P1 | `SEED-BASE` | 1. Type a partial name, then a partial email. | The table narrows on each. Search fires on `ngModelChange`, so confirm it does not issue a request per keystroke without debouncing. | Not Run |
| UI-CUS-007 | Clearing the search restores the list | Edge | P2 | A search is active | 1. Clear the box. | The full list returns. | Not Run |
| UI-CUS-008 | Search with no matches | Edge | P2 | `SEED-BASE` | 1. Search for `zzzznotfound`. | An empty-state message, not a bare table or an error. | Not Run |
| UI-CUS-009 | A row navigates to the detail page | Positive | P1 | `SEED-BASE` | 1. Click a customer. | Navigates to `/customers/:id` for that customer. | Not Run |
| UI-CUS-010 | Arabic names render correctly | Edge | P3 | A customer named in Arabic | 1. Open `/customers`. | Correct glyphs and letter joining. Layout stays LTR — GAP-161, not a defect in this page. | Not Run |

## Customer detail — `/customers/:id`

| ID | Title | Type | Pri | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|
| UI-CDT-001 | Details, edit form and history render | Positive | P1 | A customer with tickets and notes | 1. Open `/customers/:id`. | The name as a heading, the edit form pre-filled with phone, email and address, and a history table. | Not Run |
| UI-CDT-002 | Update contact details | Positive | P1 | An existing customer | 1. Change phone, email and address.<br>2. Submit. | Saved, and the values persist after a page reload. | Not Run |
| UI-CDT-003 | An email collision is reported | Negative | P1 | Another customer holds that email | 1. Submit the colliding email. | The `409` is surfaced to the user and the field keeps the entered value for correction. | Not Run |
| UI-CDT-004 | Add a note | Positive | P1 | An existing customer | 1. Type a note.<br>2. Submit. | The note is saved and appears in the history table. | Not Run |
| UI-CDT-005 | The note button is disabled when empty | Edge | P2 | An existing customer | 1. Leave the textarea empty. | The submit button is disabled — bound to `!noteText`. | Not Run |
| UI-CDT-006 | History links to tickets | Positive | P1 | A customer with tickets | 1. Click a ticket entry in the history. | Navigates to `/tickets/:id`. Note-type entries have no `ticketId` — confirm they are not rendered as dead links. | Not Run |
| UI-CDT-007 | A customer with no history | Edge | P2 | A new customer | 1. Open the page. | An empty-state message rather than an empty table. | Not Run |
| UI-CDT-008 | An unknown customer id | Negative | P2 | API running | 1. Open `/customers/{random-uuid}`. | A not-found message. The page must not crash or show a blank shell. | Not Run |

## Tickets — `/tickets`

| ID | Title | Type | Pri | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|
| UI-TKT-001 | The ticket list renders | Positive | P1 | `SEED-BASE` | 1. Open `/tickets`. | A table of tickets, newest first, showing number, subject, status, category and priority. | Not Run |
| UI-TKT-002 | The customer select is populated | Positive | P1 | `SEED-BASE` | 1. Open the create form. | The customer dropdown lists existing customers, so a raw GUID need not be typed. | Not Run |
| UI-TKT-003 | Create a ticket | Positive | P1 | A customer exists | 1. Choose a customer, enter a subject, pick category and priority.<br>2. Submit. | Created with status `Open` and appears at the top of the list. | Not Run |
| UI-TKT-004 | Validation errors are shown per field | Negative | P1 | API running | 1. Submit with no customer, then with an empty subject. | The offending control is marked `invalid` and a message identifies it. | Not Run |
| UI-TKT-005 | Category and priority selects offer exactly the enum values | Positive | P1 | — | 1. Open both dropdowns. | Five categories and four priorities, matching the API enums. `FeatureRequest` must be present and readable. | Not Run |
| UI-TKT-006 | The status filter reloads from the server | Positive | P1 | Tickets in several statuses | 1. Change the status filter. | The list reloads — this filter calls the API, unlike the others. | Not Run |
| UI-TKT-007 | Search, category and priority filter client-side | Positive | P1 | `SEED-BASE` | 1. Type in the search box, then change category and priority. | The visible rows narrow without a new request — these apply to the already-loaded set. Note the consequence: they filter only the first 200 tickets the API returned (GAP-16). | Not Run |
| UI-TKT-008 | Filters combine | Positive | P2 | Mixed tickets | 1. Apply search, category and priority together. | Only rows matching all criteria remain. | Not Run |
| UI-TKT-009 | Clear filters resets everything | Positive | P2 | Several filters applied | 1. Click clear. | All filters reset and the full list returns, including the server-side status filter. | Not Run |
| UI-TKT-010 | No results after filtering | Edge | P2 | `SEED-BASE` | 1. Apply filters that match nothing. | An empty-state message, not a bare table. | Not Run |
| UI-TKT-011 | A row navigates to the detail page | Positive | P1 | `SEED-BASE` | 1. Click a ticket. | Navigates to `/tickets/:id`. | Not Run |
| UI-TKT-012 | Creating with no customers available | Edge | P2 | `SEED-EMPTY` | 1. Open the create form. | The customer select is empty and the form cannot be submitted misleadingly. Ideally it prompts the user to create a customer first. | Not Run |

## Ticket detail — `/tickets/:id`

The densest page in the application, and the one most likely to expose defects.

| ID | Title | Type | Pri | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|
| UI-TDT-001 | All panels render | Positive | P1 | A ticket with a customer, messages and history | 1. Open `/tickets/:id`. | Ticket header, status buttons, assign, escalate, category and priority selects, AI panel, customer panel, message thread, history and the internal-note form. | Not Run |
| UI-TDT-002 | A legal status change succeeds | Positive | P1 | An `Open` ticket | 1. Click `Pending`. | The status updates and the page reflects it. | Not Run |
| UI-TDT-003 | An illegal status change is reported clearly | Negative | P1 | An `Open` ticket | 1. Click `Closed`. | The `400` is surfaced with the allowed transitions. **Better still**, the button should be disabled — check whether the UI offers transitions it knows will fail, and raise it if so. | Not Run |
| UI-TDT-004 | Assign by agent GUID | Positive | P1 | A ticket and a known agent id | 1. Paste the GUID.<br>2. Click assign. | The ticket is assigned. Note the field is free text with no picker, because no route lists users (GAP-132) — record the usability impact. | Not Run |
| UI-TDT-005 | Escalate with a reason | Positive | P1 | A non-escalated ticket | 1. Enter a reason.<br>2. Click escalate. | The ticket shows as escalated with the reason. | Not Run |
| UI-TDT-006 | Escalating without a reason | Negative | P1 | A non-escalated ticket | 1. Click escalate with the field empty. | Either the button is disabled or the `400` is surfaced. It must not fail silently. | Not Run |
| UI-TDT-007 | Change category and priority | Positive | P1 | An existing ticket | 1. Change both selects.<br>2. Save. | Both persist after reload. | Not Run |
| UI-TDT-008 | Load an AI summary | Positive | P2 | A ticket with messages | 1. Click the summary button. | The summary text appears. Confirm a loading state while the call is in flight. | Not Run |
| UI-TDT-009 | Load a suggested reply | Positive | P2 | A ticket | 1. Click the suggested-reply button. | The suggestion appears and is **not** sent anywhere — there is no send action, by design (GAP-18). | Not Run |
| UI-TDT-010 | The customer panel links through | Positive | P2 | A ticket | 1. Click the customer link. | Navigates to `/customers/:id`. | Not Run |
| UI-TDT-011 | The message thread shows channels | Positive | P2 | A ticket with messages from several channels | 1. Read the thread. | Messages are in time order with their channel labelled. | Not Run |
| UI-TDT-012 | Add an internal note with an author | Positive | P2 | A ticket and an agent id | 1. Enter the note and the author GUID.<br>2. Submit. | Accepted. The button is disabled unless both fields are filled. Note the posted note cannot be read back anywhere (GAP-26) — confirm what the UI shows afterwards. | Not Run |
| UI-TDT-013 | Message content is escaped when rendered | Security | P1 | A ticket whose message body is `<img src=x onerror=alert(1)>` | 1. Open the page. | The text renders literally as characters. **No script executes and no element is injected.** Angular escapes interpolated bindings by default — this case fails only if the component uses `innerHTML` or `bypassSecurityTrustHtml`. Given that inbound channels are unauthenticated (GAP-58), this is the highest-priority UI case in the suite. | Not Run |
| UI-TDT-014 | An unknown ticket id | Negative | P2 | API running | 1. Open `/tickets/{random-uuid}`. | A not-found message rather than a crash. | Not Run |
| UI-TDT-015 | A ticket with no messages or history | Edge | P2 | A freshly created ticket | 1. Open the page. | Empty states in both panels. Note a new ticket legitimately has empty history (GAP-56). | Not Run |

## Knowledge base — `/knowledge-base`

| ID | Title | Type | Pri | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|
| UI-KB-001 | Search returns results | Positive | P3 | `SEED-KB` | 1. Type a term matching an article. | Matching articles are listed. | Not Run |
| UI-KB-002 | Search fires per keystroke | Edge | P3 | `SEED-KB` | 1. Type a six-character word slowly.<br>2. Watch the network tab. | Bound to `ngModelChange`. Count the requests — six calls for six characters is a defect worth raising, especially given the search endpoint is uncapped (GAP-87). | Not Run |
| UI-KB-003 | Clearing the search box | Edge | P3 | A search is active | 1. Delete the query. | The results clear. `GET /api/kb/search?q=` returns `[]`, so the list should empty rather than show everything. | Not Run |
| UI-KB-004 | No results | Edge | P3 | `SEED-KB` | 1. Search `zzzznotfound`. | An empty-state message. | Not Run |
| UI-KB-005 | Ask the chatbot | Positive | P3 | `SEED-KB` with a matching article | 1. Type a question and press Enter. | A reply appears. Enter and the send button both work — the input binds `keyup.enter`. | Not Run |
| UI-KB-006 | The chatbot hands off | Edge | P3 | `SEED-KB` | 1. Ask something unmatched. | The hand-off message appears. Note that nothing actually happens behind it (GAP-107) — confirm the UI does not promise more than the API delivers. | Not Run |
| UI-KB-007 | An empty chatbot message | Negative | P3 | — | 1. Press Enter with an empty box. | Either nothing is sent or the `400` is handled. No unhandled error. | Not Run |
| UI-KB-008 | Article content is escaped when rendered | Security | P3 | A published article whose body contains a script tag | 1. View it. | Rendered as literal text. Article creation is unauthenticated (GAP-89), so this is the second-highest-priority UI security case. | Not Run |

## Cross-cutting UI tests

| ID | Title | Type | Pri | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|
| UI-X-001 | An unknown route redirects home | Edge | P2 | 1. Open `/does-not-exist`. | Redirected to `/` — the wildcard route. | Not Run |
| UI-X-002 | Browser navigation works | Edge | P2 | 1. Navigate through several pages.<br>2. Use back and forward. | State restores correctly on every step. | Not Run |
| UI-X-003 | Deep links load directly | Positive | P2 | 1. Paste `/tickets/:id` into a fresh tab. | The page loads fully without going through the list first. | Not Run |
| UI-X-004 | No console errors | Edge | P2 | 1. Visit every page with the console open. | No errors and no unhandled promise rejections. | Not Run |
| UI-X-005 | API failures never leave a blank page | Negative | P1 | 1. Stop the API.<br>2. Visit all six pages. | Each shows a visible error state. A blank page or a permanent spinner is a defect. | Not Run |
| UI-X-006 | Slow responses show a loading state | Edge | P2 | 1. Throttle the network to 3G.<br>2. Load each page. | A loading indicator appears. The user is never left looking at an apparently empty page. | Not Run |
| UI-X-007 | No secret or internal identifier is displayed unnecessarily | Security | P2 | 1. Review every page for raw GUIDs and internal fields. | Agent and author GUIDs appear in input fields by necessity (GAP-132), but no API key, webhook secret or credential is ever rendered. | Not Run |
