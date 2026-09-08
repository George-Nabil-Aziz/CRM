# Test Cases — 45 Manage users and roles

| | |
|---|---|
| **Story** | [`stories/45-manage-users-roles`](../../../stories/45-manage-users-roles/story.md) |
| **Spec** | [`specs/45-manage-users-roles`](../../../specs/45-manage-users-roles/spec.md) |
| **Area** | Security & Administration |
| **Priority** | P2 |
| **Endpoints** | `POST /api/users`, `GET /api/users/{id}`, `POST /api/roles`, `GET /api/roles/{id}` |
| **Implementation** | [`UsersController.cs`](../../../backend/CrmApi/Controllers/UsersController.cs), [`RolesController.cs`](../../../backend/CrmApi/Controllers/RolesController.cs) |

## "Manage" is create and read only

| Capability | Present |
|---|---|
| Create a user / role | Yes, both audited |
| Read one by id | Yes |
| **List** users or roles | **No** |
| Update, deactivate or delete | **No** |
| Set a password or any credential | **No** — a `User` has a name, an email and a role, nothing more |

The absence of credentials is why GAP-01 exists: there is nothing to authenticate *with*.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-45-001 | Create a role | Positive | P2 | No role named `Agent` | `{"name":"Agent","permissions":["tickets.read","tickets.write"]}` | 1. `POST /api/roles`. | `201 Created` with a generated `id`, the name and the permission list. | Not Run |
| TC-45-002 | Create a role with no permissions | Edge | P2 | API running | `{"name":"Viewer"}` | 1. `POST /api/roles`. | `201 Created` with `permissions: []` — the null coalesces to an empty list. | Not Run |
| TC-45-003 | A duplicate role name is rejected | Negative | P2 | Role `Agent` exists | `{"name":"Agent"}` | 1. `POST /api/roles`. | `409 Conflict` with `A role with this name already exists.` | Not Run |
| TC-45-004 | An empty role name is rejected | Negative | P2 | API running | `{"name":""}` | 1. `POST /api/roles`. | `400 Bad Request` naming `Name`. | Not Run |
| TC-45-005 | Create a user and assign a role | Positive | P2 | Role `Agent` exists | `{"name":"Sara Nabil","email":"sara@azm.com","roleId":"<agent-role-id>"}` | 1. `POST /api/users`. | `201 Created` with a generated `id`, the submitted fields, `roleName: "Agent"` resolved from the role, and a UTC `createdAt`. | Not Run |
| TC-45-006 | A non-existent role is rejected | Negative | P2 | API running | `roleId` set to a random UUID | 1. `POST /api/users`. | `404 Not Found` with `roleId does not reference an existing role.` Note this is `404`, not the `400` the spec pattern implies — the same deviation as GAP-03. | Not Run |
| TC-45-007 | A duplicate user email is rejected | Negative | P2 | A user with `sara@azm.com` exists | The same email, different name | 1. `POST /api/users`. | `409 Conflict` with `A user with this email already exists.` | Not Run |
| TC-45-008 | The role check runs before the email check | Edge | P2 | An existing user email **and** a bad role id in one payload | Both invalid | 1. `POST /api/users`. | `404`, not `409` — the role lookup precedes the email uniqueness query. Confirms the check order. | Not Run |
| TC-45-009 | A malformed email is rejected | Negative | P2 | Role `Agent` exists | `{"name":"Sara","email":"not-an-email","roleId":"<valid>"}` | 1. `POST /api/users`. | `400 Bad Request` naming `Email`. | Not Run |
| TC-45-010 | An empty name or missing role id is rejected | Negative | P2 | API running | `{"name":""}`, then `roleId` omitted | 1. `POST /api/users` once per case. | `400 Bad Request` each time. | Not Run |
| TC-45-011 | Fetch a user with their role name | Positive | P2 | TC-45-005 has passed | The user's id | 1. `GET /api/users/{id}`. | `200 OK` with `roleName` populated — the query includes the `Role` navigation. | Not Run |
| TC-45-012 | Fetch a user or role that does not exist | Negative | P2 | API running | Random UUIDs | 1. `GET /api/users/{random}`.<br>2. `GET /api/roles/{random}`. | `404 Not Found` both times. | Not Run |
| TC-45-013 | User and role creation are audited | Positive | P2 | API running | — | 1. Create a role, then a user.<br>2. `GET /api/audit-logs`. | Two entries: `create`/`role` and `create`/`user`, each carrying the new id. Both have a null `actorId` — there is no identity to record (GAP-01). | Not Run |
| TC-45-014 | Users and roles cannot be listed | Negative | P2 | Several users and roles exist | — | 1. Look for `GET /api/users` and `GET /api/roles`. | Neither exists. An administrator cannot see who is in the system without already knowing each id, so the agent-id fields throughout the product (assignment, reminders, notifications) have no picker to populate them. Evidence for GAP-132. | Not Run |
| TC-45-015 | Users cannot be updated, deactivated or deleted | Negative | P2 | An existing user | — | 1. Look for update or delete routes. | There are none. A user's role cannot be changed and a departing employee cannot be removed or disabled — they simply remain, permanently. Evidence for GAP-132. | Not Run |
| TC-45-016 | A user has no credentials | Negative | P2 | An existing user | — | 1. Inspect the `User` model and every user route. | There is no password, hash, token or external identity field. Users are directory entries only, which is why no authentication can exist yet. This is the root of GAP-01, recorded here at its source. | Not Run |
| TC-45-017 | Anyone can create a user with any role | Security | P2 | A role carrying every permission exists | A payload naming that role | 1. `POST /api/users` with no credentials. | Currently `201 Created`. An unauthenticated caller can mint a user in the highest-privileged role. Harmless only because permissions are not enforced anywhere (story 46) — but it becomes a privilege-escalation path the moment auth is added without also protecting this route. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-45-001, TC-45-005, TC-45-011 | |
| AC-2 Invalid input → 400 | TC-45-004, TC-45-009, TC-45-010 | TC-45-006 records the `404`-vs-`400` deviation |
| AC-3 Conflict → 409 | TC-45-003, TC-45-007 | |
| AC-4 Authorization → 401/403 | TC-45-017 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-132 | Users and roles can only be created and fetched by id. There is no list, no update, no deactivation and no delete, so a departing employee cannot be removed and no UI can offer an agent picker. |
| GAP-133 | The `User` model holds no credential of any kind, which is the underlying reason authentication does not exist. |
