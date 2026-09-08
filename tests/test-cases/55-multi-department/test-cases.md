# Test Cases — 55 Multi-department

| | |
|---|---|
| **Story** | [`stories/55-multi-department`](../../../stories/55-multi-department/story.md) |
| **Spec** | [`specs/55-multi-department`](../../../specs/55-multi-department/spec.md) |
| **Area** | Platform |
| **Priority** | P4 |
| **Endpoints** | `POST /api/departments`, `GET /api/departments` |
| **Implementation** | [`PlatformController.cs`](../../../backend/CrmApi/Controllers/PlatformController.cs) |

## A department is a name in a table, connected to nothing

`Department` is `{ Id, Name }`. Nothing references it: no foreign key from `User`, `Ticket`,
`AssignmentRule` or `SlaRule`, and no filter anywhere accepts a department id. Creating
departments therefore has no effect on routing, visibility, reporting or permissions.

The story is "multi-department"; what exists is a list of department names.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-55-001 | Create a department | Positive | P4 | API running | `{"name":"Technical Support"}` | 1. `POST /api/departments`. | `201 Created` with a generated `id` and the submitted name. | Not Run |
| TC-55-002 | List departments | Positive | P4 | Three departments exist | — | 1. `GET /api/departments`. | `200 OK` with all three, each `{id, name}`. | Not Run |
| TC-55-003 | A new department appears immediately | Positive | P4 | TC-55-001 has passed | — | 1. `GET /api/departments`. | The new department is present. | Not Run |
| TC-55-004 | An empty name is rejected | Negative | P4 | API running | `{"name":""}` | 1. `POST /api/departments`. | `400 Bad Request` naming `Name`. | Not Run |
| TC-55-005 | A missing name is rejected | Negative | P4 | API running | `{}` | 1. `POST`. | `400 Bad Request` naming `Name`. | Not Run |
| TC-55-006 | An empty list renders cleanly | Edge | P4 | `SEED-EMPTY` | — | 1. `GET /api/departments`. | `200 OK` with `[]`. | Not Run |
| TC-55-007 | Duplicate names are permitted | Edge | P4 | `Technical Support` exists | The identical payload | 1. `POST` again.<br>2. `GET /api/departments`. | Two departments with the same name and different ids. There is no uniqueness constraint — unlike roles, which do reject a duplicate name. Raise as an inconsistency. | Not Run |
| TC-55-008 | The list is unordered | Edge | P4 | Five departments | — | 1. `GET /api/departments` several times. | No `OrderBy` is applied, so the sequence is whatever the database returns. A picker cannot show a stable alphabetical list. | Not Run |
| TC-55-009 | Departments cannot be updated or deleted | Negative | P4 | An existing department with a typo in its name | — | 1. Look for update or delete routes. | There are none. A misspelled department is permanent, and TC-55-007 means the only remedy is a duplicate. Evidence for GAP-163. | Not Run |
| TC-55-010 | Nothing can be assigned to a department | Negative | P4 | A department exists; users and tickets exist | — | 1. Inspect `User`, `Ticket`, `AssignmentRule` and `SlaRule` for a department reference.<br>2. Search every endpoint for a department parameter. | There is no foreign key and no parameter anywhere. A department cannot own a user, a ticket or a rule. **Expected to fail against story 55's intent** — evidence for GAP-164. | Not Run |
| TC-55-011 | Tickets cannot be filtered or routed by department | Negative | P4 | Two departments exist | — | 1. Attempt `GET /api/tickets?departmentId={id}`.<br>2. Attempt to create an assignment rule scoped to a department. | Neither is possible — the query parameter is ignored and `CreateAssignmentRuleRequest` has no department field. Work cannot be routed to a department, which is the central promise of the story. Follows from GAP-164. | Not Run |
| TC-55-012 | Reports cannot be broken down by department | Negative | P4 | Departments and resolved tickets exist | — | 1. `GET /api/reports/tickets?groupBy=department`. | Grouped by **status** — `department` is an unrecognised grouping and falls to the default arm with no error, exactly as `priority` does. See GAP-120. | Not Run |
| TC-55-013 | Department creation is not audited | Negative | P4 | API running | A valid payload | 1. `POST`.<br>2. `GET /api/audit-logs`. | No entry. `PlatformController` does not take `AuditLogger`, unlike users, roles and settings — consistent with GAP-138. | Not Run |
| TC-55-014 | Anyone can create a department | Security | P4 | API running | Any valid payload | 1. `POST /api/departments` with no credentials. | Currently `201 Created`, and — because of GAP-163 — the entry can never be removed. Low impact while departments govern nothing. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-55-001, TC-55-002 | Creation and listing only |
| AC-2 Invalid input → 400 | TC-55-004, TC-55-005 | |
| AC-3 Not found / conflict | TC-55-006, TC-55-007 | Duplicates are permitted |
| AC-4 Authorization → 401/403 | TC-55-014 | Blocked, GAP-01 |
| Story intent — work is organised by department | TC-55-010, TC-55-011 | Expected to fail — GAP-164 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-163 | Departments cannot be updated or deleted, and duplicate names are permitted. |
| GAP-164 | No entity references a department and no endpoint accepts one, so departments cannot own users, tickets or rules and cannot route or filter anything. |
