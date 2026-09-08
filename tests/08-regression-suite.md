# Regression Suite — CRM

Three nested sets. Each is a **selection of cases defined elsewhere** — nothing is restated
here, so a case only ever has one definition.

| Set | Cases | Target time | When to run |
|---|---|---|---|
| **Smoke** | 22 | ~15 minutes | Every push, every deployment, before any other testing |
| **Core** | 88 | ~2 hours | Every pull request touching the backend or the front end |
| **Full** | 881 | ~2 days | Before a release, and after any change to a shared service |

Smoke ⊂ Core ⊂ Full. If smoke fails, stop — do not run the wider sets until it passes.

---

## REG-SMK — Smoke (22 cases)

The shortest path that proves the system is alive and the primary flow works. Every case is P1
and none depends on background timing.

| # | Case | Verifies |
|---|---|---|
| REG-SMK-01 | `EC-X-05` | API responds; unknown routes `404` |
| REG-SMK-02 | `TC-01-001` | Create a customer |
| REG-SMK-03 | `TC-01-007` | Customer appears in the list |
| REG-SMK-04 | `TC-05-001` | Create a ticket |
| REG-SMK-05 | `TC-05-002` | Ticket number is generated |
| REG-SMK-06 | `TC-05-013` | Ticket list filters by status |
| REG-SMK-07 | `TC-07-001` | Assign a ticket |
| REG-SMK-08 | `TC-08-001` | Full status lifecycle |
| REG-SMK-09 | `TC-08-006` | Illegal transition rejected |
| REG-SMK-10 | `TC-09-001` | Escalate a ticket |
| REG-SMK-11 | `TC-10-001` | Ticket history returns |
| REG-SMK-12 | `TC-11-001` | Inbound email lands on a ticket |
| REG-SMK-13 | `TC-16-001` | Unified thread returns |
| REG-SMK-14 | `TC-17-001` | Agent queue returns |
| REG-SMK-15 | `TC-44-001` | Dashboard returns all four sections |
| REG-SMK-16 | `UI-DSH-001` | Dashboard page renders |
| REG-SMK-17 | `UI-CUS-002` | Create a customer through the UI |
| REG-SMK-18 | `UI-TKT-003` | Create a ticket through the UI |
| REG-SMK-19 | `UI-TDT-001` | Ticket detail page renders |
| REG-SMK-20 | `UI-X-005` | API failure shows an error, not a blank page |
| REG-SMK-21 | `EC-X-02` | Enums serialise as strings |
| REG-SMK-22 | `EC-X-03` | Timestamps are UTC |

## REG-CORE — Core (88 cases)

Smoke plus every P1 case and the highest-risk P2 behaviour. This is the pull-request gate.

### Everything in Smoke (22)

### Customer Management (8)
`TC-01-002`, `TC-01-003`, `TC-01-011`, `TC-02-001`, `TC-02-002`, `TC-02-003`, `TC-03-001`, `TC-04-001`

### Ticket Management (14)
`TC-05-004`, `TC-05-005`, `TC-05-010`, `TC-06-001`, `TC-06-002`, `TC-07-003`, `TC-08-002`,
`TC-08-005`, `TC-08-010`, `TC-08-013`, `TC-09-003`, `TC-09-006`, `TC-10-002`, `TC-10-007`

### Communication Channels (7)
`TC-11-002`, `TC-11-004`, `TC-12-001`, `TC-13-001`, `TC-14-001`, `TC-15-001`, `TC-16-003`

### Agent Dashboard (5)
`TC-17-003`, `TC-17-009`, `TC-18-001`, `TC-20-002`, `TC-21-002`

### SLA & Automation (7)
`TC-22-001`, `TC-22-002`, `TC-23-001`, `TC-23-005`, `TC-24-001`, `TC-25-001`, `TC-25-011`

### Knowledge Base and AI (5)
`TC-26-001`, `TC-28-001`, `TC-29-003`, `TC-30-001`, `TC-31-001`

### Portal (4)
`TC-35-001`, `TC-36-001`, `TC-37-001`, `TC-39-001`

### Reports (3)
`TC-40-001`, `TC-41-001`, `TC-42-001`

### Security & Administration (2)
`TC-45-005`, `TC-47-001`

### Integration (5)
`INT-001`, `INT-006`, `INT-015`, `INT-023`, `INT-026`

### UI (6)
`UI-CUS-003`, `UI-CUS-006`, `UI-TKT-007`, `UI-TDT-002`, `UI-TDT-013`, `UI-X-001`

## REG-FULL — Full (881 cases)

Every case in [`test-cases/`](test-cases/) plus every cross-cutting case in
[`03-edge-cases.md`](03-edge-cases.md), [`04-negative-cases.md`](04-negative-cases.md),
[`05-api-tests.md`](05-api-tests.md), [`06-ui-tests.md`](06-ui-tests.md) and
[`07-integration-tests.md`](07-integration-tests.md).

50 of these are **Blocked** on GAP-01 and cannot pass until authentication exists. Count them as
blocked, never as failed, and never as passed.

---

## Change-driven selection

When a change touches one area, these are the cases most likely to break — chosen because they
cross a boundary the change could disturb.

| Change touches | Also run | Why |
|---|---|---|
| `TicketsController` | `INT-001`, `INT-015`, `INT-022`, `TC-23-001`, `TC-41-001` | Creation drives automation, webhooks and every report |
| `TicketAutomationService` | `INT-001`, `INT-012`, `INT-013`, `INT-014`, `TC-22-002` | Runs on every creation path — agent, portal and all five channels |
| `ChannelIngestionService` | `INT-001`…`INT-005`, all of stories 11–16 | Shared by five endpoints; a change affects every channel at once |
| `SlaMonitorService` | `INT-006`…`INT-011`, `TC-24-*`, `TC-25-*` | Timing-sensitive and idempotency-critical |
| `WebhookDispatcher` | `INT-022`…`INT-025`, `TC-05-011`, `TC-08-017`, `TC-09-009` | Fired from four different places |
| `AiService` | `TC-30-*`, `TC-31-*`, `TC-32-*`, `TC-33-*`, `TC-34-*`, `INT-013`, `INT-018` | `Categorize` also runs inside ingestion |
| `Mappers` | `TC-05-001`, `TC-18-002`, `TC-18-003`, `TC-36-004` | One shape reused across agent and portal responses |
| `CrmDbContext` or a migration | Full suite | Schema changes reach everything |
| `Program.cs` | `API-X-005`, `API-X-006`, `EC-X-02`, `NC-X-08` | CORS, HTTPS and JSON conventions live here |
| Any DTO | The story's own file plus `04-negative-cases.md` §2 | Validation attributes define the `400` behaviour |
| `api.service.ts` or `models.ts` | All of `06-ui-tests.md` | Shared by all six pages |
| One Angular page | That page's `UI-*` block plus `UI-X-*` | |

## Standing checks — run with every set

| Check | Case | Why it always matters |
|---|---|---|
| Rendered content is escaped | `UI-TDT-013`, `UI-KB-008` | Inbound channels and article creation are both unauthenticated (GAP-58, GAP-89) |
| A broken partner cannot break the CRM | `INT-023` | The only external dependency in the request path |
| Error responses leak nothing | `NC-X-07` | |
| Injection input is treated as data | `NC-X-06` | |
| A fresh deployment works | `INT-030` | Protects the first-run experience, which no other case covers |

## Once authentication lands

The 50 blocked cases become the acceptance list for that change, and `API-X-007` inverts: it
currently asserts that all 74 endpoints are anonymous, and must then assert the opposite. Add
the whole set to Core at that point — an endpoint accidentally left unprotected is exactly the
kind of regression this suite exists to catch.
