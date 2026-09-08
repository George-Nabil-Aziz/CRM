# Customer Support CRM

A multi-channel customer support platform. Customers reach out by email, WhatsApp, SMS,
chat or a web form; every message becomes a ticket; agents categorise, assign and resolve
against SLA targets; managers watch workload and escalations; administrators configure the
platform.

Core workflow: **contact → ticket → categorise → assign → communicate → monitor SLA →
escalate → resolve → report**

---

## Where this stands

**This is a working skeleton, not a finished product.** Every one of the 57 feature
specifications has code behind it, and the primary flow genuinely works end to end — a
customer emails in, a ticket is created and categorised, automation assigns it and stamps
its SLA targets, a background monitor escalates it when the target passes, and the whole
thing lands in the reports. That chain is real and can be demonstrated.

What sits around that chain is thinner than the specification calls for, and the gaps are
named rather than hidden.

**The largest one: there is no authentication.** [`Program.cs`](./backend/CrmApi/Program.cs)
calls `app.UseAuthorization()` but registers no authentication scheme, and no controller
carries `[Authorize]`. All 74 endpoints are anonymous. Every one of the 57 specs contains an
"Authorization → 401/403" acceptance criterion, so this single absence leaves 57 acceptance
criteria unmet. `User` also holds no credential of any kind — no password, no hash, no
external identity — so there is nothing yet to authenticate *with*. Role permissions are
stored and audited but never read; API keys are issued but never verified.

Beyond that, the pattern across the codebase is **create-only**. Most resources can be
written and never corrected:

| Cannot be edited or deleted | Consequence |
| --------------------------- | ----------- |
| Knowledge-base articles | A published article with an error in it is permanent |
| SLA and assignment rules | A wrong rule can never be fixed, and the duplicate guard blocks replacing it |
| Users and roles | A departing employee cannot be removed or disabled |
| Webhook subscriptions | A subscription cannot be revoked |
| Notes, quick replies, departments, branches | Typos are forever |

And several features are write-only — they can be created but never read back. Internal
notes cannot be listed and appear in no history, so team collaboration is invisible.
Reminders have no list, no dismiss, and nothing fires when one falls due. Feedback comments
are stored and surfaced nowhere.

The full list is **169 findings**, each traced to the line of code that produces it:

**→ [`tests/README.md`](./tests/README.md)** for the summary,
**[`tests/01-test-strategy.md`](./tests/01-test-strategy.md) §9** for the blocked coverage,
and the *Findings* table at the foot of each of the 57 story files.

### Known rough edges you will hit immediately

- **The frontend and backend disagree on a port.** `api.service.ts` calls
  `http://localhost:5080/api`; the API launches on `http://localhost:5110`. There is no
  proxy configuration. Fix one or the other before the UI will load any data — see
  [Getting started](#getting-started).
- **`WeatherForecastController` is still routed.** Visual Studio scaffolding, no business
  purpose, safe to delete.
- **`.specify/memory/constitution.md` is an untouched template**, still full of
  `[PLACEHOLDER]` markers.

### Where the work comes from

This is a [Spec-Kit](https://github.com/github/spec-kit) project. The specification is not
prose in this README — it is 57 numbered features, each with a user story, a full technical
spec, an API contract, an implementation plan and a task list:

| Directory | Holds |
| --------- | ----- |
| [`stories/`](./stories/) | 57 user stories — the *why*, in one page each |
| [`specs/`](./specs/) | 57 specifications — acceptance criteria, data fields, edge cases, plus `contracts/api.md` and `tasks.md` |
| [`tests/`](./tests/) | 881 test cases derived from those specs and from the code as built |

Each spec carries four acceptance criteria in a consistent shape — happy path, invalid
input, not-found/conflict, authorization — so a feature is not "done" because it returns
`200`, but because all four hold.

**The task lists were never checked off.** All 570 tasks across the 57 `tasks.md` files are
still `- [ ]`, including 114 tagged `[Test]`, even though the code for most of them exists.
The task lists record what was planned; [`tests/`](./tests/) records what is actually true
of the code. Where the two disagree, the tests folder is the honest one — it was written by
reading the implementation, not the plan.

### Specification deviations

Where the code and the spec disagree, the deviation is recorded rather than quietly
accepted. The ones worth knowing before reading the code:

| Spec says | Code does |
| --------- | --------- |
| Ticket numbers like `TCK-00123`, sequential | `TCK-` + 8 hex characters from a GUID |
| Unknown `customerId` → `400` | `404` |
| Duplicate ticket → `409` | No duplicate detection — and the same spec's Edge Cases section says the opposite, so the spec contradicts itself |
| Live chat over `WS /ws/chat` | `POST /api/channels/chat/messages` — no WebSocket exists |
| `POST /api/settings/branding` | `PATCH /api/settings/branding` |
| `authorId` on notes, `actorId` on ticket events | Never populated — there is no identity to record |

---

## Getting started

You need **.NET 10 SDK**, **Node 20+**, and **SQL Server** (LocalDB or Express is fine).
There is no Docker Compose in this repository — the stack is run directly.

### Backend

```
cd backend/CrmApi
dotnet restore
dotnet ef database update
dotnet run
```

The API starts on **http://localhost:5110** (and `https://localhost:7062`). The connection
string is `CrmDb` in [`appsettings.json`](./backend/CrmApi/appsettings.json), pointing at
`localhost\SQLEXPRESS` with Windows authentication — change it if your instance differs.

`dotnet ef database update` applies 7 migrations and is required on a fresh database.
There is **no seed script**, so the database starts empty: create a customer before
creating a ticket, and expect every list to be empty and every report to be zero until you
do.

### Frontend

```
cd frontend
npm install
npm start
```

Vite-less Angular CLI serves on **http://localhost:4200**.

> **Fix the port before this will work.** `frontend/src/app/api.service.ts` hard-codes
> `const BASE = 'http://localhost:5080/api'`, but the API listens on `5110`. Either change
> that constant to `5110`, or change `applicationUrl` in
> [`launchSettings.json`](./backend/CrmApi/Properties/launchSettings.json) to `5080`. Until
> then every request fails and the UI looks broken when it is not.

| What | Where |
| ---- | ----- |
| Frontend | http://localhost:4200 |
| API | http://localhost:5110 |
| OpenAPI document | http://localhost:5110/openapi/v1.json *(development only)* |

**CORS allows only `http://localhost:4200` and `http://localhost:4300`.** If every API call
fails at once — from a different port, a LAN address, or a real phone — that is the cause,
not the application.

---

## Signing in

The app opens on a sign-in screen at `/login`. There is also `/signup` at
[`signup.page.ts`](./frontend/src/app/pages/signup.page.ts).

### Demo accounts

One per role in the specifications. Username and password are the same word in each case.

| Persona | Username | Password | Role | Sees |
| ------- | -------- | -------- | ---- | ---- |
| Administrator | `admin` | `admin` | Admin | Everything — dashboard, tickets, customers, knowledge base |
| Support Manager | `manager` | `manager` | Manager | Everything |
| Support Agent | `agent` | `agent` | Agent | Everything |
| Customer | `customer` | `customer` | Customer | Dashboard and knowledge base only |

They are also listed on the sign-in page itself — click any one to fill the form and sign
in with a single click, rather than typing.

Those four cover 49 of the 57 user stories. The specs also mention Supervisor, Executive,
System and Developer in one story each; those are not seeded.

### Read this before trusting any of it

> **This is a demo sign-in and secures nothing.** It is a front-end illusion over an API
> that has no authentication at all.

- **Credentials are compared in the browser.** They are in the JavaScript bundle, readable
  by anyone who opens dev tools. `admin` / `admin` is not a weak password here so much as a
  label on a door with no lock.
- **The session is a `localStorage` key.** Deleting `crm-session` is the entire bypass.
- **No request carries a token.** Every API call goes out anonymous, exactly as before.
  `curl http://localhost:5110/api/tickets` returns every ticket without signing in at all.
- **Role-based navigation is cosmetic.** The customer persona is offered fewer sidebar
  links; nothing stops it from typing `/tickets` into the address bar, and nothing at all
  stops it from calling the API directly.
- **Sign-up creates no account.** There is no registration endpoint and `User` stores no
  credential. Submitting the form signs you in as the customer persona using the name you
  typed. The validation on that form is real, and mirrors what the API applies to
  `POST /api/customers` — but nothing is persisted.

Making this real means adding a credential store and a login endpoint on the server,
issuing a token, and putting `[Authorize]` on the 19 controllers. That is item 1 of
[What would come next](#what-would-come-next), and it is what unblocks the 50 test cases
currently marked `Blocked`.

### Where it lives

| File | Holds |
| ---- | ----- |
| [`auth.service.ts`](./frontend/src/app/auth.service.ts) | The four personas, credential check, session persistence |
| [`auth.guard.ts`](./frontend/src/app/auth.guard.ts) | `authGuard` redirects signed-out visitors to `/login`; `guestGuard` keeps signed-in users off it |
| [`pages/login.page.ts`](./frontend/src/app/pages/login.page.ts) | Sign-in form plus the one-click persona picker |
| [`pages/signup.page.ts`](./frontend/src/app/pages/signup.page.ts) | Sign-up form |
| [`app.component.ts`](./frontend/src/app/app.component.ts) | Hides the shell when signed out; renders the current user and sign-out control |

To add a persona, add an entry to `PERSONAS` in `auth.service.ts` — its `routes` array
decides which sidebar links it is offered.

---

## Repository layout

| Directory | Contents |
| --------- | -------- |
| `backend/CrmApi/` | ASP.NET Core 10 Web API — 19 controllers, EF Core, SQL Server |
| `frontend/` | Angular 18 standalone-component app, 6 routes |
| `specs/` | 57 Spec-Kit specifications with API contracts, plans and task lists |
| `stories/` | 57 user stories |
| `tests/` | 881 written test cases and the QA strategy. **Documentation, not runnable tests** |
| `.specify/` | Spec-Kit templates, scripts and workflow definitions |
| `.claude/` | Spec-Kit slash-command skills |

### Backend

| Folder | Holds |
| ------ | ----- |
| `Controllers/` | 19 controllers, ~74 endpoints |
| `Services/` | `TicketAutomationService`, `ChannelIngestionService`, `SlaMonitorService`, `AiService`, `WebhookDispatcher`, `AuditLogger` |
| `Models/` | Domain entities and enums |
| `Dtos/` | Request and response records with their validation attributes |
| `Data/CrmDbContext.cs` | The EF Core context |
| `Migrations/` | 7 migrations |

The interesting logic is in `Services/`, not the controllers. Four stories — automatic
assignment, escalation rules, alerts, and automatic categorisation — have **no HTTP endpoint
at all**; they run inside these services and are only observable through their effects.

`SlaMonitorService` is a hosted `BackgroundService` on a **1-minute** timer with a
**15-minute** SLA warning window. Both are hard-coded constants, not settings.

### Frontend

Eight standalone components, one per route, each holding its own template and styles inline.
Shared API access is [`api.service.ts`](./frontend/src/app/api.service.ts); shared types are
[`models.ts`](./frontend/src/app/models.ts).

| Route | Page | Guard |
| ----- | ---- | ----- |
| `/login`, `/signup` | Sign in, sign up | `guestGuard` |
| `/` | Dashboard | `authGuard` |
| `/customers`, `/customers/:id` | Customers | `authGuard` |
| `/tickets`, `/tickets/:id` | Tickets | `authGuard` |
| `/knowledge-base` | Knowledge base | `authGuard` |

The guards route signed-out visitors to `/login` and signed-in ones away from it. They are
navigation only — see [Signing in](#signing-in) for what that does and does not protect.

---

## Scripts

### Backend — from `backend/CrmApi`

| Command | What it does |
| ------- | ------------ |
| `dotnet build` | Compiles. Nullable reference types are enabled, so a nullability warning is a real signal |
| `dotnet run` | Starts the API on `5110` |
| `dotnet ef database update` | Applies migrations |
| `dotnet ef migrations add <Name>` | Adds one |

### Frontend — from `frontend`

| Command | What it does |
| ------- | ------------ |
| `npm start` | `ng serve` on `4200` |
| `npm run build` | Production build to `dist/` |
| `npm run watch` | Development build in watch mode |
| `npm test` | `ng test` — Karma and Jasmine are installed but **no spec files exist**, so this runs zero tests |

**There is no verification command and no CI.** No `.github/workflows`, no pipeline, no
pre-commit hook. Nothing runs automatically on a push, so nothing catches a regression
except a person.

---

## Testing

[`tests/`](./tests/) holds 881 written test cases across all 57 stories — 247 positive, 277
negative, 294 edge and 63 security — plus a strategy, a scenario list, an endpoint
inventory, UI and integration suites, and a regression selection.

**None of it has been executed, and none of it is automated.** Every case reads `Not Run`.
It is a manual QA suite written by reading the implementation against the specs, and it is
ready for someone to work through — not a record of a test run.

Two consequences worth stating plainly:

- **The expected results are inferences from source code, not observations.** The cases most
  likely to be wrong are the ones that depend on database collation (case sensitivity in
  email uniqueness, KB search, setting keys) and on `LIKE` wildcard handling. Those cases
  say "record the actual behaviour" rather than asserting one.
- **The 169 findings are likewise unverified by execution.** They are grounded in specific
  code, but nobody has run the code to confirm each one.

Test data is referenced as `SEED-BASE`, `SEED-SLA`, `SEED-KB` and `SEED-EMPTY`. **Those
seeds do not exist yet** — they are a prerequisite anyone executing the suite has to build
first.

Start with [`tests/08-regression-suite.md`](./tests/08-regression-suite.md) → Smoke: 22
cases, roughly 15 minutes, and enough to tell whether the system is alive.

---

## Conventions and constraints

**Enums are strings on the wire.** `Program.cs` registers `JsonStringEnumConverter`
globally, so every request and response uses `"Open"`, never `0`. A numeric enum anywhere is
a bug.

**Every timestamp is UTC.** `DateTime.UtcNow` throughout. SLA arithmetic depends on it, so a
local-time value entering the system would corrupt every deadline.

**Validation lives on the DTO, not in the controller.** `[Required]`, `[EmailAddress]`,
`[Range]` and friends on the request record, with `[ApiController]` turning a failure into a
`400` with a `ProblemDetails` body naming the field. If you add a field, its rule belongs on
the record.

**Ticket status is a state machine, not a free assignment.** The transition table lives in
`TicketsController`:

| From | May become |
| ---- | ---------- |
| `Open` | `Pending`, `Resolved` |
| `Pending` | `Open`, `Resolved` |
| `Resolved` | `Closed`, `Open` |
| `Closed` | `Open` |

Nothing reaches `Closed` without passing through `Resolved`. An illegal transition returns
`400` with the legal options listed in the body.

**All five inbound channels share one ingestion path.** `ChannelIngestionService` resolves
the sender to a customer, finds or creates their newest open ticket, and appends the
message. Change it and you change email, WhatsApp, SMS, chat and the web form at once.

**Webhook delivery is best-effort and must stay that way.** A failing subscriber is logged
and swallowed; it must never fail the request that triggered it.

The platform is specified to ship in English and Arabic. **Only the data layer is bilingual
today** — Arabic content stores and returns correctly, but there is no localisation
middleware, no translation files, no language switcher and no RTL layout. Two features are
hard-coded English and cannot serve an Arabic user at all: AI suggested replies, and the
keyword list behind automatic categorisation.

---

## What would come next

In the order that removes the most risk:

1. **Authentication and authorization.** It unblocks 50 written test cases, 57 acceptance
   criteria, and makes the existing roles, permissions and API keys mean something. Nothing
   else is worth hardening first.
2. **Update and delete routes** for articles, rules, users and webhooks — the create-only
   pattern above.
3. **An outbound message route.** Every channel is inbound-only, so an agent cannot reply to
   a customer through the system at all. It is the largest functional hole in the product.
4. **Read routes for internal notes and reminders**, which are currently write-only.
5. **Pagination.** No endpoint paginates; two cap silently at 200 and one at 50.
6. **CI**, running the build plus whatever automated tests get written.
