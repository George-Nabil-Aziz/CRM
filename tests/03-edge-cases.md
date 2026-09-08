# Edge Cases — CRM

294 cases across the suite are typed `Edge`. They live in their story folders under
[`test-cases/`](test-cases/); this document groups them by the **theme** they probe, so a tester
can run one class of risk across the whole product rather than story by story.

Each theme states the rule, names the boundary, and lists where it is tested.

---

## 1. Boundary values

Exact limits, and the value one step either side of them.

| Boundary | Rule as implemented | Cases |
|---|---|---|
| Feedback rating | `[Range(1,5)]` — 1 and 5 accepted, 0 and 6 rejected | `TC-39-005…009` |
| SLA target minutes | `[Range(1,int.MaxValue)]` — 0 and negatives rejected | `TC-22-006`, `TC-22-007` |
| SLA warning window | Target within the next 15 minutes, **inclusive** at exactly 15 | `TC-25-004` |
| SLA breach | Strictly `< now` — a ticket exactly at its target is not yet breached | `TC-24-008` |
| SLA compliance | `ResolvedAt <= ResolutionTargetAt` — exactly on target counts as met | `TC-41-003` |
| Summary truncation | 160 characters; exactly 160 is **not** truncated | `TC-30-005`, `TC-30-006` |
| Chatbot reply truncation | 300 characters; exactly 300 is **not** truncated | `TC-34-002`, `TC-34-003` |
| Ticket subject from body | First 80 characters; shorter bodies used whole | `TC-12-003`, `TC-12-004` |
| Chatbot word matching | Words **longer than** 3 characters; a 4-character word matches | `TC-34-010` |
| SMS length | 160 characters is one segment; longer text is not reassembled | `TC-14-007`, `TC-14-008` |

## 2. Empty and first-run states

Every list endpoint must return `[]` rather than `404` or `null`, and every aggregate must
survive a division by zero.

| Surface | Expected empty behaviour | Cases |
|---|---|---|
| Customer history | `[]` | `TC-03-004` |
| Ticket history | `[]` — creation writes no event | `TC-10-006` |
| Message thread | `[]` | `TC-16-004` |
| Agent queue | `[]` | `TC-17-008` |
| Knowledge base and search | `[]` | `TC-26-007`, `TC-28-006`, `TC-38-009` |
| AI suggested solutions | `[]` | `TC-33-008` |
| Portal request list | `[]` | `TC-37-006` |
| Ticket report | `[]` — **not** four zeroed statuses | `TC-40-013` |
| SLA report | `[]` — distinguishes "nothing measured" from "all missed" | `TC-41-014`, `TC-41-015` |
| Agent report | `0` average, not a division error | `TC-42-006` |
| CSAT report | `{0,0,0}` — but `0` is outside the 1–5 scale | `TC-43-006` |
| Dashboard | Three empty arrays plus zeroed CSAT | `TC-44-006`, `TC-44-007` |
| Branding | Model defaults, **not** `404` | `TC-57-007` |

## 3. Idempotency and repeat submission

What happens when the same call arrives twice — the answer differs per endpoint, which is itself
the finding.

| Action | Second call does | Cases |
|---|---|---|
| Same-status update | `200`, no event, no webhook | `TC-08-010`, `TC-08-018` |
| Re-assign to the same agent | `200`, **writes a second event** | `TC-07-004` |
| Escalate twice | `200`, silently discards the new reason | `TC-09-006` |
| Re-publish an article | `200`, **overwrites** `PublishedAt` | `TC-29-011` |
| Mark a notification read twice | `204`, harmless | `TC-25-012` |
| Duplicate feedback | `409` | `TC-39-013` |
| Duplicate ticket creation | Two independent tickets | `TC-05-010` |
| Repeated provider delivery id | De-duplicated | `TC-11-004`, `TC-14-004` |
| Repeated chat or web-form submit | **Not** de-duplicated | `TC-13-006`, `TC-15-009` |

## 4. Partial updates and null semantics

Three different meanings of "not supplied" coexist in the codebase.

| Endpoint | Null means | Empty string means | Cases |
|---|---|---|---|
| Customer phone | Skip | **Skip** (`IsNullOrWhiteSpace`) | `TC-02-006` |
| Customer address | Skip | **Apply** (`is not null`) | `TC-02-007` |
| Ticket category / priority | Skip | n/a — enum | `TC-06-007` |
| Branding fields | Skip | **Apply** — the only way to clear a logo | `TC-57-005`, `TC-57-006` |
| Empty request body | No-op `200` | — | `TC-02-009`, `TC-06-006`, `TC-57-004` |

## 5. Ordering, ties and stability

| Surface | Order | Risk | Cases |
|---|---|---|---|
| Customer history | `timestamp` **descending** | Ties between a ticket and a note are unresolved | `TC-03-006` |
| Ticket history | `timestamp` **ascending** | Opposite convention to customer history (GAP-57) | `TC-10-001` |
| Message thread | `sentAt` ascending; ties unresolved | | `TC-16-006` |
| Agent queue | Priority desc, then oldest first | | `TC-17-003` |
| Notifications | `sentAt` descending | | `TC-25-009` |
| FAQ list, KB search, portal KB | **No ordering at all** | Unstable between calls | `TC-26-009`, `TC-28-013`, `TC-38-011` |
| Quick replies | **No ordering** | Picker cannot show a stable list | `TC-20-013` |
| Departments, branches | **No ordering** | | `TC-55-008`, `TC-56-010` |
| Assignment rules | Specificity **before** `Order`; equal pairs are non-deterministic | | `TC-23-005`, `TC-23-008` |

## 6. Unicode and text handling

| Concern | Cases |
|---|---|
| Arabic round-trips through every layer | `TC-53-001…008`, `TC-14-010`, `TC-16-011`, `TC-27-012` |
| Mixed Arabic and English in one field | `TC-53-005` |
| Arabic-Indic digits preserved, not normalised | `TC-53-006` |
| Truncation must not split a character | `TC-30-013`, `TC-53-009` |
| Byte-versus-character length limits | `TC-04-009`, `TC-53-010` |
| HTML and script text stored verbatim | `TC-15-011`, `TC-16-010`, `TC-27-011`, `TC-29-020` |

## 7. Case sensitivity

Every one of these depends on the database collation, so each case must **record the observed
behaviour** rather than assume it.

| Lookup | Case-sensitive would mean | Cases |
|---|---|---|
| Customer email uniqueness | A duplicate person is created | `TC-01-013` |
| Inbound email sender matching | A duplicate customer per casing | `TC-11-014` |
| KB search | Capitalised queries silently fail | `TC-28-011` |
| Quick reply category filter | Filter returns nothing | `TC-20-008` |
| Audit log target type filter | Filter returns nothing | `TC-47-005` |
| Setting keys | Two settings for one key | `TC-48-010` |

## 8. Concurrency and timing

| Scenario | Cases |
|---|---|
| Simultaneous article reads lose view-count increments | `TC-27-009` |
| Concurrent ERP sync triggers, no run lock | `TC-50-011` |
| Dashboard sections read at different instants | `TC-44-011` |
| Ticket creation and automation commit atomically | `TC-05-015`, `TC-23-020` |
| Internal note and its notifications commit atomically | `TC-21-014` |
| SLA monitor tolerates a failing run | `TC-24-011` |

## 9. Unbounded results

No endpoint in the product paginates. Two apply a hard cap; the rest return everything.

| Endpoint | Limit | Cases |
|---|---|---|
| `GET /api/tickets` | 200, no cursor | `TC-05-012` |
| `GET /api/customers` | 200, no cursor | `TC-01-012` |
| `GET /api/integrations/erp/sync-logs` | 50, no cursor | `TC-50-005` |
| Agent queue | **None** | `TC-17-012` |
| Customer history | **None**, merged in memory | `TC-03-008` |
| Message thread | **None** | `TC-16-012` |
| Portal request list | **None** | `TC-37-011` |
| KB search and portal KB | **None** | `TC-28-014`, `TC-38-012` |
| Audit log | **None**, on an ever-growing table | `TC-47-017` |
| All four reports | **None**, aggregated in memory | `TC-40-016`, `TC-44-012` |

## 10. Cross-cutting edge cases

These belong to no single story and are defined here.

| ID | Title | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| EC-X-01 | Every list endpoint returns `[]` for an empty database | `SEED-EMPTY` | 1. Call every `GET` list endpoint in the API in turn. | Each returns `200` with `[]`. None returns `404`, `null`, or a `500`. | Not Run |
| EC-X-02 | Enums are serialised as strings everywhere | `SEED-BASE` | 1. Call every endpoint returning an enum field.<br>2. Inspect each value. | Always strings such as `"Open"`, never integers — `JsonStringEnumConverter` is registered globally. One numeric value anywhere is a defect. | Not Run |
| EC-X-03 | Every timestamp is UTC | `SEED-BASE` | 1. Create a customer, ticket, note, message and reminder.<br>2. Compare each stored timestamp with UTC now. | All are UTC. No endpoint stores local time — mixed kinds would corrupt every SLA calculation. | Not Run |
| EC-X-04 | A malformed GUID in a path returns 404, not 500 | API running | 1. Call each `{id:guid}` route with `not-a-guid`. | `404` from the route constraint. Never a `500` and never a `400` from deep in the pipeline. | Not Run |
| EC-X-05 | An unknown route returns 404 | API running | 1. `GET /api/does-not-exist`. | `404` with no stack trace and no framework detail. | Not Run |
| EC-X-06 | A malformed JSON body returns 400 | API running | 1. `POST /api/tickets` with `{"subject":` as the body. | `400` with a `ProblemDetails` body. No `500`, and no parser internals leaked. | Not Run |
| EC-X-07 | The leftover scaffold controller is still routed | API running | 1. `GET /api/WeatherForecast`. | It responds. This is Visual Studio scaffolding with no business purpose and should be deleted — GAP-08. | Not Run |
| EC-X-08 | A database outage degrades cleanly | API running, database stopped | 1. Call several endpoints.<br>2. Restore the database and retry. | `500` or `503` with no connection string, credential or stack trace in the response body. Service resumes after recovery. | Not Run |

---

## Where the remaining edge cases live

| Area | Story folders |
|---|---|
| Customer Management | [`01`](test-cases/01-customer-profile/test-cases.md) – [`04`](test-cases/04-notes-attachments/test-cases.md) |
| Ticket Management | [`05`](test-cases/05-create-track-tickets/test-cases.md) – [`10`](test-cases/10-ticket-history/test-cases.md) |
| Communication Channels | [`11`](test-cases/11-contact-email/test-cases.md) – [`16`](test-cases/16-unified-multichannel-thread/test-cases.md) |
| Agent Dashboard | [`17`](test-cases/17-view-assigned-tickets/test-cases.md) – [`21`](test-cases/21-team-collaboration/test-cases.md) |
| SLA & Automation | [`22`](test-cases/22-sla-targets/test-cases.md) – [`25`](test-cases/25-alerts-notifications/test-cases.md) |
| Knowledge Base | [`26`](test-cases/26-browse-faqs/test-cases.md) – [`29`](test-cases/29-manage-kb-content/test-cases.md) |
| AI Features | [`30`](test-cases/30-ai-ticket-summaries/test-cases.md) – [`34`](test-cases/34-ai-chatbot/test-cases.md) |
| Customer Portal | [`35`](test-cases/35-submit-tickets-portal/test-cases.md) – [`39`](test-cases/39-submit-feedback/test-cases.md) |
| Reports & Management | [`40`](test-cases/40-ticket-reports/test-cases.md) – [`44`](test-cases/44-management-dashboards/test-cases.md) |
| Security & Administration | [`45`](test-cases/45-manage-users-roles/test-cases.md) – [`48`](test-cases/48-system-configuration/test-cases.md) |
| Integrations | [`49`](test-cases/49-apis/test-cases.md) – [`52`](test-cases/52-external-systems/test-cases.md) |
| Platform | [`53`](test-cases/53-arabic-english/test-cases.md) – [`57`](test-cases/57-custom-branding/test-cases.md) |
