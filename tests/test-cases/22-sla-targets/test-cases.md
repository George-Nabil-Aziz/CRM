# Test Cases — 22 Response and resolution targets

| | |
|---|---|
| **Story** | [`stories/22-sla-targets`](../../../stories/22-sla-targets/story.md) |
| **Spec** | [`specs/22-sla-targets`](../../../specs/22-sla-targets/spec.md) |
| **Area** | SLA & Automation |
| **Priority** | P2 |
| **Endpoints** | `POST /api/sla-rules`, `GET /api/sla-rules`, `GET /api/sla-rules/{id}` |
| **Implementation** | [`SlaRulesController.cs`](../../../backend/CrmApi/Controllers/SlaRulesController.cs), [`TicketAutomationService.cs`](../../../backend/CrmApi/Services/TicketAutomationService.cs) |

## How a rule reaches a ticket

A rule is matched on the **exact pair** (`Category`, `Priority`) at the moment a ticket is
created. When one matches, `TicketAutomationService` stamps two absolute timestamps onto the
ticket:

```
ResponseTargetAt   = ticket.CreatedAt + ResponseTargetMinutes
ResolutionTargetAt = ticket.CreatedAt + ResolutionTargetMinutes
```

Three consequences drive this file:

- Matching is on the exact pair, so covering the whole product needs 5 × 4 = **20 rules**.
- Targets are computed **only at creation** and are never recalculated (GAP-31).
- Only `ResolutionTargetAt` is ever enforced. `ResponseTargetAt` is stored and reported but no
  code reads it (GAP-29).

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-22-001 | Create an SLA rule | Positive | P2 | No rule exists for `Technical`/`High` | `{"category":"Technical","priority":"High","responseTargetMinutes":30,"resolutionTargetMinutes":240}` | 1. `POST /api/sla-rules`. | `201 Created` with a generated `id` and the submitted values echoed back. | Not Run |
| TC-22-002 | A new ticket inherits the matching targets | Positive | P2 | TC-22-001 has passed | A `Technical`/`High` ticket | 1. `POST /api/tickets`.<br>2. Read `ResponseTargetAt` and `ResolutionTargetAt`. | `ResponseTargetAt` is `createdAt + 30 minutes` and `ResolutionTargetAt` is `createdAt + 240 minutes`, matching to the second. | Not Run |
| TC-22-003 | A ticket with no matching rule gets no targets | Edge | P2 | A rule exists only for `Technical`/`High` | A `Billing`/`Low` ticket | 1. `POST /api/tickets`.<br>2. Read both target fields. | Both are `null`. The ticket is created normally but is invisible to the SLA monitor, which skips rows where `ResolutionTargetAt` is null. | Not Run |
| TC-22-004 | Matching requires both category and priority | Edge | P2 | A rule for `Technical`/`High` only | A `Technical`/`Low` ticket | 1. `POST /api/tickets`.<br>2. Read the target fields. | Both are `null`. A category rule does **not** cover every priority within that category — there is no wildcard, unlike assignment rules which allow a null category. | Not Run |
| TC-22-005 | A duplicate category/priority rule is rejected | Negative | P2 | TC-22-001 has passed | The same category and priority, different minutes | 1. `POST /api/sla-rules` again. | `409 Conflict` with `An SLA rule for this category/priority combination already exists.` | Not Run |
| TC-22-006 | A zero target is rejected | Negative | P2 | API running | `responseTargetMinutes: 0` | 1. `POST /api/sla-rules`. | `400 Bad Request` — `[Range(1, int.MaxValue)]`. | Not Run |
| TC-22-007 | A negative target is rejected | Negative | P2 | API running | `resolutionTargetMinutes: -5` | 1. `POST /api/sla-rules`. | `400 Bad Request`. | Not Run |
| TC-22-008 | A missing category or priority is rejected | Negative | P2 | API running | Omit `category`; then omit `priority` | 1. `POST` once per case. | `400 Bad Request` each time. | Not Run |
| TC-22-009 | An invalid enum value is rejected | Negative | P2 | API running | `"priority":"Critical"` | 1. `POST /api/sla-rules`. | `400 Bad Request`. | Not Run |
| TC-22-010 | A resolution target shorter than the response target is accepted | Edge | P2 | API running | `{"responseTargetMinutes":240,"resolutionTargetMinutes":30}` | 1. `POST /api/sla-rules`.<br>2. Create a matching ticket and read its targets. | `201 Created` and the ticket's resolution deadline falls **before** its response deadline. There is no cross-field validation, so a nonsensical rule is storable and will skew the SLA report. Raise as a defect. | Not Run |
| TC-22-011 | Rules can be listed and fetched by id | Positive | P2 | Two rules exist | — | 1. `GET /api/sla-rules`.<br>2. `GET /api/sla-rules/{id}` for one of them. | `200 OK` for both; the list holds both rules and the single fetch returns the matching one. | Not Run |
| TC-22-012 | Fetching a rule that does not exist | Negative | P2 | API running | A random UUID | 1. `GET /api/sla-rules/{random-uuid}`. | `404 Not Found`. | Not Run |
| TC-22-013 | An empty rule set lists cleanly | Edge | P3 | `SEED-EMPTY` | — | 1. `GET /api/sla-rules`. | `200 OK` with `[]`. | Not Run |
| TC-22-014 | Rules cannot be edited or deleted | Negative | P2 | A rule with the wrong minutes | — | 1. Look for update or delete routes on `/api/sla-rules`. | There are none. Combined with the duplicate guard in TC-22-005, a wrong rule can neither be corrected nor replaced — the pair is permanently occupied. Evidence for GAP-28, and the most damaging gap in this area. | Not Run |
| TC-22-015 | Existing tickets are unaffected by a new rule | Edge | P2 | An `Open` ticket created before any rule existed | A rule matching that ticket's pair | 1. Create the rule.<br>2. Re-read the pre-existing ticket's targets. | Both remain `null`. Rules apply only to tickets created after them, so introducing SLAs leaves the existing backlog permanently unmonitored. Flag for the rollout plan. | Not Run |
| TC-22-016 | Changing a ticket's priority does not recompute its targets | Edge | P2 | Rules for `Technical`/`Low` and `Technical`/`Urgent`; a `Technical`/`Low` ticket | `{"priority":"Urgent"}` | 1. Note the targets.<br>2. `PATCH /api/tickets/{id}` to raise the priority.<br>3. Re-read the targets. | Unchanged. Escalating a ticket's priority does not tighten its deadline, and the monitor keeps using the original one — GAP-31. | Not Run |
| TC-22-017 | The response target is never enforced | Negative | P2 | A ticket whose `ResponseTargetAt` has passed but whose `ResolutionTargetAt` has not | — | 1. Trigger an `SlaMonitorService` run.<br>2. Re-read the ticket and the agent's notifications. | Nothing happens — no escalation, no notification. The monitor reads only `ResolutionTargetAt`, so half of story 22 is stored and reported but never acted upon. Evidence for GAP-29. | Not Run |
| TC-22-018 | Targets are computed in UTC | Edge | P2 | A rule with a 60-minute resolution target | A matching ticket | 1. Create the ticket.<br>2. Compare `ResolutionTargetAt` with `CreatedAt`. | The difference is exactly 60 minutes and both are UTC — `CreatedAt` is set from `DateTime.UtcNow`, so no local-time drift enters the arithmetic. | Not Run |
| TC-22-019 | Business hours are not considered | Edge | P2 | A rule with a 240-minute resolution target | A ticket created at 23:00 UTC on a Friday | 1. Create the ticket.<br>2. Read `ResolutionTargetAt`. | 03:00 Saturday — the target is wall-clock arithmetic with no working-calendar awareness. Every out-of-hours ticket therefore breaches. Confirm against the product intent of story 22. | Not Run |
| TC-22-020 | Unauthorized caller cannot create an SLA rule | Security | P2 | Auth layer deployed | No credentials | 1. `POST /api/sla-rules` with no `Authorization` header. | `401 Unauthorized`. Until then anyone can define the SLA policy the whole system runs on. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-22-001, TC-22-002, TC-22-011 | |
| AC-2 Invalid input → 400 | TC-22-006…009 | TC-22-010 shows cross-field validation is missing |
| AC-3 Conflict → 409 | TC-22-005 | |
| AC-4 Authorization → 401/403 | TC-22-020 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-28 | SLA rules cannot be updated or deleted, and the duplicate guard makes a wrong rule unrecoverable. |
| GAP-29 | `ResponseTargetAt` is calculated and reported but never enforced. |
| GAP-31 | Targets are computed only at creation and are never recomputed when category or priority changes. |
| GAP-75 | There is no cross-field validation, so a resolution target may be earlier than the response target. |
| GAP-76 | Targets are plain wall-clock arithmetic with no business-hours or working-calendar awareness. |
| GAP-77 | Introducing a rule leaves every pre-existing ticket permanently without SLA targets. |
