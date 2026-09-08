# Test Documentation — CRM

Manual QA test documentation covering all **57 specifications** in
[`specs/`](../specs/). Written by reading the implementation against the specs.

> **Nothing here has been executed.** Every case has status `Not Run`. This is a written test
> suite ready for a QA team to run, not a record of a test run.

## Contents

| # | Document | What it holds |
|---|---|---|
| 1 | [`01-test-strategy.md`](01-test-strategy.md) | Scope, levels, environments, test data, entry/exit criteria, defect classification, **known gaps** |
| 2 | [`02-test-scenarios.md`](02-test-scenarios.md) | 197 one-line scenarios across the 57 stories |
| 3 | [`test-cases/`](test-cases/) | **881 detailed cases** in 57 folders, one per story |
| 4 | [`03-edge-cases.md`](03-edge-cases.md) | 294 edge cases indexed by theme, plus 8 cross-cutting |
| 5 | [`04-negative-cases.md`](04-negative-cases.md) | 277 negative cases indexed by failure mode, plus 8 cross-cutting |
| 6 | [`05-api-tests.md`](05-api-tests.md) | All 74 endpoints with their contracts |
| 7 | [`06-ui-tests.md`](06-ui-tests.md) | 61 cases across the 6 Angular pages |
| 8 | [`07-integration-tests.md`](07-integration-tests.md) | 30 multi-service chains and end-to-end journeys |
| 9 | [`08-regression-suite.md`](08-regression-suite.md) | Smoke (22) / Core (88) / Full (881) selections |
| — | [`traceability-matrix.md`](traceability-matrix.md) | Story ↔ endpoint ↔ case ↔ finding index |

## Totals

| | Count |
|---|---|
| Stories covered | 57 of 57 |
| Detailed test cases | 881 |
| — Positive | 247 |
| — Negative | 277 |
| — Edge | 294 |
| — Security | 63 |
| Blocked on missing auth | 50 |
| Endpoints documented | 74 |
| Findings raised | 169 |

## Layout

```
tests/
├── 01-test-strategy.md
├── 02-test-scenarios.md
├── test-cases/
│   ├── 01-customer-profile/test-cases.md
│   ├── 02-contact-details/test-cases.md
│   └── …  57 folders, named to match specs/
├── 03-edge-cases.md
├── 04-negative-cases.md
├── 05-api-tests.md
├── 06-ui-tests.md
├── 07-integration-tests.md
├── 08-regression-suite.md
└── traceability-matrix.md
```

Folder names under `test-cases/` match `specs/` and `stories/` exactly, so story 22 is
`specs/22-sla-targets/`, `stories/22-sla-targets/` and `tests/test-cases/22-sla-targets/`.

## Case identifiers

| Prefix | Meaning | Example |
|---|---|---|
| `TS-` | Scenario | `TS-05-01` |
| `TC-` | Detailed case — the two digits are the spec number | `TC-22-003` |
| `EC-X-` / `NC-X-` | Cross-cutting edge / negative | `EC-X-01` |
| `API-` / `UI-` / `INT-` / `REG-` | API, UI, integration, regression | `INT-006` |

## How to use it

1. Read [`01-test-strategy.md`](01-test-strategy.md) §9 first — it lists what **cannot** be
   tested and why, so blocked coverage is not mistaken for missing coverage.
2. Run [`08-regression-suite.md`](08-regression-suite.md) → Smoke. If it fails, stop.
3. For a specific feature, open its folder in [`test-cases/`](test-cases/).
4. For a code change, use the change-driven table in the regression suite.
5. Record results in the `Status` column: `Pass`, `Fail`, `Blocked` or `N/A`.

## The headline finding

**There is no authentication or authorization.** `Program.cs` calls `app.UseAuthorization()` but
registers no authentication scheme, and no controller carries `[Authorize]`. All 74 endpoints are
anonymous, yet every one of the 57 specs contains an "Authorization → 401/403" acceptance
criterion.

The 50 affected cases are written out in full and marked **Blocked** — they become the acceptance
list the day auth is added. Related: `User` holds no credential of any kind (GAP-133), role
permissions are stored but never read (GAP-136), and API keys are issued but never verified
(GAP-146).

Beyond that, the largest functional gaps are:

| Gap | Impact |
|---|---|
| GAP-18 | No outbound message route — an agent cannot reply on any channel, so conversations are one-way |
| GAP-26, GAP-25 | Internal notes and reminders can be created but never read back |
| GAP-35, GAP-28, GAP-132 | Articles, SLA/assignment rules, and users cannot be edited or deleted |
| GAP-120 | `groupBy=priority` silently returns a status breakdown |
| GAP-156 | Webhook signatures cannot be verified — the secret is never disclosed to the subscriber |
| GAP-159 | Webhook URLs are unrestricted, reaching internal addresses |
| GAP-161 | No localisation at all — only the data layer is bilingual |

Full list: §9 of the strategy, and the *Findings* section at the foot of each story file.

## Prerequisites

```
cd backend/CrmApi && dotnet ef database update && dotnet run
cd frontend && npm install && npm start
```

The API allows CORS only from `http://localhost:4200` and `http://localhost:4300`. If every UI
call fails at once, check the origin before raising a defect (GAP-162).
