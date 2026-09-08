# Test Cases — 56 Multi-branch

| | |
|---|---|
| **Story** | [`stories/56-multi-branch`](../../../stories/56-multi-branch/story.md) |
| **Spec** | [`specs/56-multi-branch`](../../../specs/56-multi-branch/spec.md) |
| **Area** | Platform |
| **Priority** | P4 |
| **Endpoints** | `POST /api/branches`, `GET /api/branches` |
| **Implementation** | [`PlatformController.cs`](../../../backend/CrmApi/Controllers/PlatformController.cs) |

`Branch` is `{ Id, Name, Location }` — the same shape as `Department` with one extra field, and
the same limitation: **nothing references it**. No user, ticket, rule or report knows about
branches, and no endpoint accepts a branch id. See
[story 55](../55-multi-department/test-cases.md), whose findings apply here identically.

Unlike a department, a branch requires a `Location`, so validation has two required fields.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-56-001 | Create a branch | Positive | P4 | API running | `{"name":"Riyadh HQ","location":"Riyadh, Saudi Arabia"}` | 1. `POST /api/branches`. | `201 Created` with a generated `id`, the name and the location. | Not Run |
| TC-56-002 | List branches | Positive | P4 | Three branches exist | — | 1. `GET /api/branches`. | `200 OK` with all three, each `{id, name, location}`. | Not Run |
| TC-56-003 | A new branch appears immediately | Positive | P4 | TC-56-001 has passed | — | 1. `GET /api/branches`. | The new branch is present. | Not Run |
| TC-56-004 | An empty name is rejected | Negative | P4 | API running | `{"name":"","location":"Riyadh"}` | 1. `POST`. | `400 Bad Request` naming `Name`. | Not Run |
| TC-56-005 | An empty location is rejected | Negative | P4 | API running | `{"name":"Riyadh HQ","location":""}` | 1. `POST`. | `400 Bad Request` naming `Location` — unlike a department, a branch cannot be created without one. | Not Run |
| TC-56-006 | A missing field is rejected | Negative | P4 | API running | `location` omitted, then `name` omitted | 1. `POST` once per case. | `400 Bad Request` each time. | Not Run |
| TC-56-007 | An empty list renders cleanly | Edge | P4 | `SEED-EMPTY` | — | 1. `GET /api/branches`. | `200 OK` with `[]`. | Not Run |
| TC-56-008 | Duplicate branches are permitted | Edge | P4 | `Riyadh HQ` exists | The identical payload | 1. `POST` again.<br>2. `GET /api/branches`. | Two branches with the same name and location, differing only by id. No uniqueness constraint — the same inconsistency as departments. | Not Run |
| TC-56-009 | The location is unvalidated free text | Edge | P4 | API running | `{"name":"X","location":"asdfgh"}` | 1. `POST`. | `201 Created`. There is no geocoding, no country list and no structure — `Location` is a display string only, so it cannot support any location-based routing later without a schema change. | Not Run |
| TC-56-010 | The list is unordered | Edge | P4 | Five branches | — | 1. `GET /api/branches` several times. | No `OrderBy` is applied, so the sequence may vary between calls. | Not Run |
| TC-56-011 | Branches cannot be updated or deleted | Negative | P4 | A branch that has relocated | — | 1. Look for update or delete routes. | There are none. A branch that moves or closes cannot be corrected or removed. Evidence for GAP-165. | Not Run |
| TC-56-012 | Nothing can be assigned to a branch | Negative | P4 | A branch exists; users, customers and tickets exist | — | 1. Inspect `User`, `Customer`, `Ticket` and the rule models for a branch reference.<br>2. Search every endpoint for a branch parameter. | There is no foreign key and no parameter anywhere. A branch cannot own a customer, a ticket or an agent. **Expected to fail against story 56's intent** — evidence for GAP-166. | Not Run |
| TC-56-013 | Data cannot be segregated by branch | Negative | P4 | Two branches exist | — | 1. Attempt `GET /api/tickets?branchId={id}` and `GET /api/customers?branchId={id}`. | Both parameters are ignored and the full unfiltered list is returned. Every branch sees all data, which is usually the primary reason for a multi-branch feature. Follows from GAP-166. | Not Run |
| TC-56-014 | Reports cannot be broken down by branch | Negative | P4 | Branches and tickets exist | `?groupBy=branch` | 1. `GET /api/reports/tickets?groupBy=branch`. | Grouped by **status** — an unrecognised grouping falls silently to the default arm. See GAP-120. | Not Run |
| TC-56-015 | Branch creation is not audited | Negative | P4 | API running | A valid payload | 1. `POST`.<br>2. `GET /api/audit-logs`. | No entry — `PlatformController` does not use `AuditLogger`. Consistent with GAP-138. | Not Run |
| TC-56-016 | Anyone can create a branch | Security | P4 | API running | Any valid payload | 1. `POST /api/branches` with no credentials. | Currently `201 Created`, permanently. Low impact while branches govern nothing. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-56-001, TC-56-002 | Creation and listing only |
| AC-2 Invalid input → 400 | TC-56-004…006 | |
| AC-3 Not found / conflict | TC-56-007, TC-56-008 | Duplicates are permitted |
| AC-4 Authorization → 401/403 | TC-56-016 | Blocked, GAP-01 |
| Story intent — data is organised by branch | TC-56-012, TC-56-013 | Expected to fail — GAP-166 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-165 | Branches cannot be updated or deleted, and duplicates are permitted. |
| GAP-166 | No entity references a branch and no endpoint accepts one, so data cannot be segregated or reported by branch. |
