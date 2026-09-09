# Test Cases — 47 Audit logs

| | |
|---|---|
| **Story** | [`stories/47-audit-logs`](../../../stories/47-audit-logs/story.md) |
| **Spec** | [`specs/47-audit-logs`](../../../specs/47-audit-logs/spec.md) |
| **Area** | Security & Administration |
| **Priority** | P2 |
| **Endpoints** | `GET /api/audit-logs?actorId=&targetType=&dateFrom=&dateTo=` |
| **Implementation** | [`AuditLogsController.cs`](../../../backend/CrmApi/Controllers/AuditLogsController.cs), [`AuditLogger.cs`](../../../backend/CrmApi/Services/AuditLogger.cs) |

## What is actually audited

`AuditLogger` is injected into only **four** controllers. Everything else in the product writes
no audit trail at all.

| Action | Target type | Written by |
|---|---|---|
| `create` | `article` | `POST /api/kb/articles` |
| `update` | `article` | `POST /api/kb/articles/{id}/publish` |
| `create` | `user` | `POST /api/users` |
| `create` | `role` | `POST /api/roles` |
| `permission_change` | `role` | `PATCH /api/roles/{id}/permissions` |
| `update` | `setting` | `PATCH /api/settings` |

Not audited: every ticket action, every customer change, every assignment, every escalation,
all inbound messages, and all portal activity. `ActorId` is always null because there is no
identity to record.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-47-001 | Audited actions appear in the log | Positive | P2 | `SEED-EMPTY` | — | 1. Create a role, a user and an article.<br>2. `GET /api/audit-logs`. | `200 OK` with three entries, each carrying `id`, `actorId`, `action`, `targetType`, `targetId` and `timestamp`. | Not Run |
| TC-47-002 | Entries are newest first | Positive | P2 | Several audited actions at distinct times | — | 1. `GET /api/audit-logs`. | Ordered by `timestamp` descending. | Not Run |
| TC-47-003 | Each entry identifies its target | Positive | P2 | A newly created user | — | 1. `GET /api/audit-logs?targetType=user`.<br>2. Compare `targetId` with the user's id. | They match, so an entry can be traced back to the record it describes. | Not Run |
| TC-47-004 | Filter by target type | Positive | P2 | Audited actions across articles, users and roles | `?targetType=role` | 1. `GET /api/audit-logs?targetType=role`. | Only role entries — both `create` and `permission_change`. | Not Run |
| TC-47-005 | The target type filter is exact and case-sensitive | Edge | P3 | Role entries exist | `?targetType=Role` | 1. `GET /api/audit-logs?targetType=Role`. | Likely `[]` — the comparison is plain equality against the lower-case literals the loggers write. Record the actual behaviour against the database collation; a case-sensitive one makes the filter easy to get wrong. | Not Run |
| TC-47-006 | Filter by date range | Positive | P2 | Entries spanning two months | `?dateFrom=2026-02-01&dateTo=2026-02-28` | 1. `GET`. | Only entries inside the range, both bounds inclusive. | Not Run |
| TC-47-007 | Filters combine | Positive | P2 | Mixed entries | `?targetType=article&dateFrom=2026-02-01` | 1. `GET`. | Only article entries on or after the date. | Not Run |
| TC-47-008 | Filter by actor returns nothing | Negative | P2 | Several audited actions | `?actorId=<any-uuid>` | 1. `GET /api/audit-logs?actorId={any}`. | `[]` **always**. Every entry has a null `ActorId`, so the actor filter can never match anything. The filter is present in the API and permanently useless. Evidence for GAP-137. | Not Run |
| TC-47-009 | Entries never identify who acted | Negative | P2 | Any audited action | — | 1. `GET /api/audit-logs`.<br>2. Inspect `actorId` on every entry. | Null throughout. `AuditLogger.LogAsync` accepts an optional `actorId`, but no caller ever passes one because there is no authenticated identity. An audit log that cannot attribute an action is of limited value. **Expected to fail against spec 47**, which marks `actorId` required — GAP-137. | Not Run |
| TC-47-010 | Ticket actions are not audited | Negative | P2 | `SEED-EMPTY` | — | 1. Create, assign, re-categorise, escalate and resolve a ticket.<br>2. `GET /api/audit-logs`. | Empty. None of the ticket lifecycle reaches the audit log — it is recorded in ticket history instead, which is a separate store with its own gaps (GAP-13, GAP-15, GAP-17). Evidence for GAP-138. | Not Run |
| TC-47-011 | Customer changes are not audited | Negative | P2 | An existing customer | — | 1. `PATCH /api/customers/{id}` to change the email.<br>2. `GET /api/audit-logs`. | No entry. Editing a customer's contact details — a change with real data-protection weight — leaves no trace anywhere. Evidence for GAP-41 and GAP-138. | Not Run |
| TC-47-012 | The setting audit entry has no usable target | Edge | P2 | API running | `{"key":"support.email","value":"help@azm.com"}` | 1. `PATCH /api/settings`.<br>2. Inspect the entry's `targetId`. | `00000000-0000-0000-0000-000000000000` — `SettingsController` passes `Guid.Empty` because settings are keyed by string, not GUID. Every setting change is therefore indistinguishable from every other in the log. Raise as a defect — GAP-139. | Not Run |
| TC-47-013 | Entries cannot be created through the API | Security | P2 | API running | — | 1. Look for a `POST` route on `/api/audit-logs`. | There is none — `GET` is the only route. Entries can only be written in-process by `AuditLogger`, so the log cannot be forged from outside. Record as verified. | Not Run |
| TC-47-014 | Entries cannot be modified or deleted | Security | P2 | Existing entries | — | 1. Look for `PATCH`, `PUT` or `DELETE` routes on `/api/audit-logs`. | There are none. The log is append-only through the API, which is correct for an audit trail. Note the caveat: nothing prevents direct database modification, so tamper-evidence depends entirely on database permissions. Record as verified with that qualification. | Not Run |
| TC-47-015 | An empty log returns an empty list | Edge | P2 | `SEED-EMPTY` with no audited actions | — | 1. `GET /api/audit-logs`. | `200 OK` with `[]`. | Not Run |
| TC-47-016 | A malformed filter is rejected | Negative | P2 | API running | `?actorId=not-a-guid`, then `?dateFrom=not-a-date` | 1. `GET` once per case. | `400 Bad Request` each time. | Not Run |
| TC-47-017 | The log is unbounded | Edge | P3 | 100,000 audit entries | No filters | 1. `GET /api/audit-logs`. | Every entry is returned in one response. There is no cap, no paging and no default date window — an audit log grows forever by design, so this endpoint degrades over time. Raise as a performance defect — GAP-140. | Not Run |
| TC-47-018 | Anyone can read the audit log | Security | P2 | Audited actions exist | No credentials | 1. `GET /api/audit-logs` with no `Authorization` header. | Currently `200 OK`. The audit log reveals administrative activity — user creation, permission changes, configuration edits — and is precisely the record an attacker would consult first. It should be the most tightly restricted read in the product. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-47-001, TC-47-002, TC-47-004 | |
| AC-2 Invalid input → 400 | TC-47-016 | |
| AC-3 Not found | TC-47-015 | An empty result returns `[]` |
| AC-4 Authorization → 401/403 | TC-47-018 | Blocked, GAP-01 |
| Data field `actorId` | TC-47-008, TC-47-009 | Always null — GAP-137 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-137 | `ActorId` is never populated, so no audit entry can be attributed to a person and the `actorId` filter can never match. |
| GAP-138 | Only six action types across four controllers are audited. Ticket, customer, assignment, escalation, channel and portal activity produce no audit trail. |
| GAP-139 | Setting changes log `Guid.Empty` as the target, so every configuration change looks identical in the log. |
| GAP-140 | The audit log endpoint has no cap, paging or default date window, on a table designed to grow indefinitely. |
