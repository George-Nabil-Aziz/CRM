# Test Strategy — CRM

**Project**: Customer support CRM (Spec-Kit driven)
**Scope**: 57 feature specifications across 12 functional areas
**Version**: 1.0
**Status**: Baseline

---

## 1. Purpose

This document defines how the CRM is tested: what is in scope, at which level each
behaviour is verified, what must be true before testing starts and before a release
ships, and which parts of the system cannot currently be tested at all.

Every test artefact in this folder traces back to a numbered specification under
[`specs/`](../specs/) and its matching user story under [`stories/`](../stories/).

---

## 2. System Under Test

| Layer | Technology | Surface |
|---|---|---|
| Backend API | ASP.NET Core (.NET 10), EF Core, SQL Server | 19 controllers, ~74 HTTP endpoints |
| Background jobs | `BackgroundService` hosted worker | `SlaMonitorService` — runs every 1 minute |
| Domain services | Scoped services | `TicketAutomationService`, `ChannelIngestionService`, `AiService`, `WebhookDispatcher`, `AuditLogger` |
| Frontend | Angular 18 (standalone components) | 6 routes / 6 pages |
| Persistence | SQL Server via `CrmDbContext` | EF Core migrations |

### Functional areas

| # | Area | Stories | Priority |
|---|---|---|---|
| 1 | Customer Management | 01–04 | P1 |
| 2 | Ticket Management | 05–10 | P1 |
| 3 | Communication Channels | 11–16 | P2 |
| 4 | Agent Dashboard | 17–21 | P2 |
| 5 | SLA & Automation | 22–25 | P2 |
| 6 | Knowledge Base | 26–29 | P3 |
| 7 | AI Features | 30–34 | P3 |
| 8 | Customer Portal | 35–39 | P3 |
| 9 | Reports & Management | 40–44 | P3 |
| 10 | Security & Administration | 45–48 | P2 |
| 11 | Integrations | 49–52 | P4 |
| 12 | Platform | 53–57 | P4 |

---

## 3. Test Levels

| Level | What it verifies | Where it lives | Executed by |
|---|---|---|---|
| Unit | Pure logic in isolation — `AiService.Categorize`, the status-transition table, SLA target arithmetic | Not yet implemented (see §9) | Developer |
| API / Component | One endpoint end to end: routing, model validation, persistence, response shape, status code | [`05-api-tests.md`](05-api-tests.md) | QA / automation |
| Integration | Behaviour spanning services — channel ingestion → ticket creation → automation → webhook → notification | [`07-integration-tests.md`](07-integration-tests.md) | QA / automation |
| UI | The 6 Angular pages: rendering, forms, validation feedback, filters, navigation | [`06-ui-tests.md`](06-ui-tests.md) | QA (manual or Playwright) |
| Regression | A curated re-run set after every change | [`08-regression-suite.md`](08-regression-suite.md) | CI / QA |

---

## 4. Test Types in Scope

| Type | Covered | Document |
|---|---|---|
| Functional / happy path | Yes | [`test-cases/`](test-cases/) |
| Negative / validation | Yes | [`04-negative-cases.md`](04-negative-cases.md) |
| Boundary & edge | Yes | [`03-edge-cases.md`](03-edge-cases.md) |
| Contract / schema | Yes | [`05-api-tests.md`](05-api-tests.md) |
| Integration / workflow | Yes | [`07-integration-tests.md`](07-integration-tests.md) |
| UI | Yes | [`06-ui-tests.md`](06-ui-tests.md) |
| Regression | Yes | [`08-regression-suite.md`](08-regression-suite.md) |
| Security / authorization | **Blocked** — no auth layer exists | §9, GAP-01 |
| Performance / load | Out of scope for this baseline | — |
| Accessibility (WCAG) | Out of scope for this baseline | — |
| Localization (AR/EN) | Partial — story 53 covered functionally only | [`test-cases/53-arabic-english/`](test-cases/53-arabic-english/test-cases.md) |

---

## 5. Test Environments

| Environment | Purpose | Configuration |
|---|---|---|
| LOCAL | Developer smoke checks | `dotnet run` from `backend/CrmApi`, Angular `npm start` on `http://localhost:4200`, local SQL Server via the `CrmDb` connection string |
| TEST | Full suite execution | Dedicated SQL Server database restored to a known seed before each full run |
| CI | Regression smoke on every push | Ephemeral database per run |

**CORS constraint**: the API allows only `http://localhost:4200` and `http://localhost:4300`
(see [`Program.cs`](../backend/CrmApi/Program.cs)). A UI served from any other origin will fail
on cross-origin requests rather than on application logic — check this first when every UI
call fails at once.

---

## 6. Test Data

| Dataset | Contents | Used by |
|---|---|---|
| `SEED-BASE` | 3 customers, 2 agent users, 2 roles, 5 tickets covering all four statuses | Most functional cases |
| `SEED-SLA` | One SLA rule per (category, priority) pair under test, one catch-all assignment rule, one category-specific assignment rule | SLA & Automation, Integration |
| `SEED-KB` | 4 published articles (one per `ArticleType`), 2 unpublished drafts | Knowledge Base, Portal |
| `SEED-EMPTY` | Empty database | Empty-state UI cases, first-run cases |

Enumerated values used throughout, taken from the domain models:

| Enum | Allowed values |
|---|---|
| `TicketStatus` | `Open`, `Pending`, `Resolved`, `Closed` |
| `TicketCategory` | `Billing`, `Technical`, `Account`, `General`, `FeatureRequest` |
| `TicketPriority` | `Low`, `Medium`, `High`, `Urgent` |
| `TicketEventType` | `StatusChange`, `Assignment`, `Escalation`, `Message`, `Note` |
| `MessageChannel` | `Email`, `Whatsapp`, `Sms`, `Chat`, `Webform` |
| `NotificationType` | `SlaBreach`, `SlaWarning`, `Mention`, `Reminder`, `Assignment` |
| `ArticleType` | `Faq`, `Article`, `Guide` |
| `ArticleCategory` | `GettingStarted`, `Billing`, `Technical`, `Account`, `General` |
| `IntegrationChannel` | `Email`, `Sms`, `Whatsapp` |
| `ErpEntityType` | `Customer`, `Order` |
| `SyncStatus` | `Success`, `Failed`, `InProgress` |

Enums are serialised as strings — `Program.cs` registers `JsonStringEnumConverter` — so
request and response bodies use `"Open"`, not `0`.

---

## 7. Entry and Exit Criteria

### Entry criteria — testing may begin when

1. The API builds and starts without error, and `dotnet ef database update` has been applied.
2. The Angular app builds and serves without compilation errors.
3. The target environment is seeded with the dataset the case requires.
4. The specification under test is at `Draft` status or later.

### Exit criteria — a release candidate is ready when

| Criterion | Threshold |
|---|---|
| P1 test cases executed | 100% |
| P1 test cases passed | 100% |
| P2 test cases executed | 100% |
| P2 test cases passed | ≥ 95% |
| Open Critical defects | 0 |
| Open High defects | 0 |
| Regression smoke suite | 100% pass |
| Known gaps | Documented and accepted by the product owner |

---

## 8. Defect Classification

| Severity | Definition | Example in this system | Target fix |
|---|---|---|---|
| Critical | Data loss, or a core flow completely unusable | Ticket creation returns 500 for every request | Immediate |
| High | A core flow is broken with no workaround | Status transitions accept illegal values | Before release |
| Medium | A flow is broken but has a workaround, or a non-core flow fails | KB search ignores the query string | Next sprint |
| Low | Cosmetic, wording, or a minor inconsistency | Empty-state message missing on the dashboard | Backlog |

| Priority | Meaning |
|---|---|
| P1 | Blocks the release |
| P2 | Should ship fixed |
| P3 | Fix when convenient |
| P4 | Optional |

---

## 9. Known Gaps and Blocked Coverage

These are findings from reading the implementation against the specifications. They are
recorded here so that blocked coverage is visibly blocked rather than silently missing.

| ID | Finding | Impact on testing |
|---|---|---|
| GAP-01 | **No authentication or authorization exists.** `Program.cs` calls `app.UseAuthorization()` but registers no authentication scheme, and no controller carries `[Authorize]`. All 57 specs contain an "Authorization → 401/403" acceptance criterion. | Every authorization case is marked **Blocked**. They are written out in full so they become executable the moment auth lands. |
| GAP-02 | **Ticket number format differs from the spec.** Spec 05 requires a human-readable sequential number such as `TCK-00123`; `TicketsController.Create` generates `TCK-` plus 8 uppercase hex characters derived from a GUID. | Cases assert the *implemented* format and flag the deviation. |
| GAP-03 | **An unknown `customerId` returns 404, not 400.** Spec 05 AC-2 classifies an invalid `customerId` as invalid input (400); the implementation returns `NotFound`. | Cases assert 404 and flag the deviation for a product decision. |
| GAP-04 | **Spec 05 contradicts itself on duplicates.** AC-3 requires 409 on a duplicate ticket, while the same spec's Edge Cases section states every request creates an independent ticket. The implementation follows the Edge Cases reading — there is no duplicate detection. | No 409 case is written for ticket creation. The contradiction is raised as a specification defect. |
| GAP-05 | **The branding endpoint uses a different method.** Spec 57's contract declares `POST /api/settings/branding`; `PlatformController` implements `PATCH`, plus a `GET`. | Cases target `PATCH` and flag the deviation. |
| GAP-06 | **Live chat is not a WebSocket.** Spec 13 declares `WS /ws/chat`; the implementation exposes `POST /api/channels/chat/messages`. | Cases target the HTTP endpoint. Real-time push delivery is untestable as specified. |
| GAP-07 | **Stories 23, 24, 25 and 32 have no HTTP surface.** They live inside `TicketAutomationService`, `SlaMonitorService` and `AiService`. | Verified indirectly through integration cases and database assertions rather than direct API calls. |
| GAP-08 | **`WeatherForecastController` is leftover scaffolding** and is still routed. | Not tested. Recommended for deletion. |
| GAP-09 | **`SlaMonitorService` ticks once per minute** and there is no endpoint to trigger a run on demand. | Timing-dependent cases require either a 60-second wait or a test hook that calls `RunOnceAsync` directly. |
| GAP-10 | **Attachments are a URL string only** (`attachmentUrl` on customer notes); there is no upload endpoint. | File-upload coverage for story 04 is limited to URL validation. |

---

## 10. Test Case Identification

| Prefix | Artefact | Example |
|---|---|---|
| `TS-` | Test scenario | `TS-05-01` |
| `TC-` | Detailed test case | `TC-05-001` |
| `EC-` | Edge case | `EC-05-01` |
| `NC-` | Negative case | `NC-05-01` |
| `API-` | API test | `API-TKT-001` |
| `UI-` | UI test | `UI-TKT-001` |
| `INT-` | Integration test | `INT-001` |
| `REG-` | Regression set entry | `REG-SMK-01` |

The two-digit segment in `TS-`, `TC-`, `EC-` and `NC-` identifiers is the specification
number, so `TC-22-003` is the third detailed case for `specs/22-sla-targets/`.

---

## 11. Result Statuses

| Status | Meaning |
|---|---|
| `Not Run` | Not yet executed |
| `Pass` | Actual result matched the expected result |
| `Fail` | Actual result did not match; a defect is raised |
| `Blocked` | Cannot be executed because a dependency is missing (see §9) |
| `N/A` | Not applicable to the current build |

---

## 12. Deliverables

| Deliverable | Document |
|---|---|
| Test strategy | This document |
| Test scenarios | [`02-test-scenarios.md`](02-test-scenarios.md) |
| Detailed test cases | [`test-cases/`](test-cases/) — 57 folders, one per story |
| Edge cases | [`03-edge-cases.md`](03-edge-cases.md) |
| Negative cases | [`04-negative-cases.md`](04-negative-cases.md) |
| API tests | [`05-api-tests.md`](05-api-tests.md) |
| UI tests | [`06-ui-tests.md`](06-ui-tests.md) |
| Integration tests | [`07-integration-tests.md`](07-integration-tests.md) |
| Regression suite | [`08-regression-suite.md`](08-regression-suite.md) |
| Traceability matrix | [`traceability-matrix.md`](traceability-matrix.md) |
