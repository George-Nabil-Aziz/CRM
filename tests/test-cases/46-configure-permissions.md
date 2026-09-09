# Test Cases — 46 Configure permissions

| | |
|---|---|
| **Story** | [`stories/46-configure-permissions`](../../../stories/46-configure-permissions/story.md) |
| **Spec** | [`specs/46-configure-permissions`](../../../specs/46-configure-permissions/spec.md) |
| **Area** | Security & Administration |
| **Priority** | P2 |
| **Endpoints** | `PATCH /api/roles/{id}/permissions` |
| **Implementation** | [`RolesController.cs`](../../../backend/CrmApi/Controllers/RolesController.cs) |

## Permissions are stored, audited, and never enforced

`role.Permissions = request.Permissions` — a **whole-list replacement** of a
`List<string>`. The strings are free text: there is no enum, no vocabulary and no validation.

Critically, **nothing reads this list**. No controller checks it, no middleware consults it, and
no `[Authorize]` attribute exists anywhere. Configuring permissions changes a database row and
an audit entry, and changes nothing about what any caller can do. Every case below is written so
it becomes meaningful once authorisation is implemented.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-46-001 | Replace a role's permission set | Positive | P2 | A role with `["tickets.read"]` | `{"permissions":["tickets.read","tickets.write","customers.read"]}` | 1. `PATCH /api/roles/{id}/permissions`.<br>2. `GET /api/roles/{id}`. | `200 OK` and the role now holds exactly the three supplied permissions. | Not Run |
| TC-46-002 | The update replaces rather than merges | Positive | P2 | A role with `["a","b","c"]` | `{"permissions":["d"]}` | 1. `PATCH`.<br>2. Read the role back. | The role holds only `["d"]`. `a`, `b` and `c` are gone — this is a `PATCH` that behaves as a `PUT` on the collection, which a caller expecting a merge will get wrong. Note it explicitly for API consumers. | Not Run |
| TC-46-003 | Permissions can be cleared to none | Edge | P2 | A role with several permissions | `{"permissions":[]}` | 1. `PATCH`.<br>2. Read the role back. | `200 OK` with `permissions: []`. An empty list is valid and strips the role bare. | Not Run |
| TC-46-004 | A missing permissions field is rejected | Negative | P2 | An existing role | `{}` | 1. `PATCH`. | `400 Bad Request` naming `Permissions` — the field is `[Required]`, so omitting it is not the same as sending an empty list. | Not Run |
| TC-46-005 | Updating a role that does not exist | Negative | P2 | API running | A random UUID | 1. `PATCH /api/roles/{random-uuid}/permissions`. | `404 Not Found`. | Not Run |
| TC-46-006 | Arbitrary permission strings are accepted | Negative | P2 | An existing role | `{"permissions":["not-a-real-permission","",  "DROP TABLE Users"]}` | 1. `PATCH`.<br>2. Read the role back. | `200 OK` and all three strings are stored verbatim, including the empty one. There is no vocabulary, no enum and no validation, so a typo such as `ticket.read` for `tickets.read` is silently accepted and would deny access once enforcement exists. Raise as a defect — GAP-134. | Not Run |
| TC-46-007 | Duplicate permissions are stored twice | Edge | P3 | An existing role | `{"permissions":["tickets.read","tickets.read"]}` | 1. `PATCH`.<br>2. Read the role back. | Both entries persist — the list is assigned without de-duplication. Harmless today, but it makes the stored set an unreliable representation of the intent. | Not Run |
| TC-46-008 | Permission changes are audited | Positive | P2 | An existing role | Any valid permission list | 1. `PATCH`.<br>2. `GET /api/audit-logs?targetType=role`. | An entry with action `permission_change`, target type `role` and the role's id. This is a distinct action name from `create`, so privilege changes are separable in the log — good practice, record as verified. | Not Run |
| TC-46-009 | The audit entry does not say what changed | Negative | P2 | A role changed from `["a"]` to `["a","b","admin.all"]` | — | 1. `PATCH`.<br>2. Inspect the audit entry. | It records only that a `permission_change` happened on that role. Neither the previous nor the new permission set is captured, and `actorId` is null, so the log cannot answer who granted which privilege — the single most important question an audit trail exists to answer. Raise as a defect — GAP-135. | Not Run |
| TC-46-010 | Permissions have no runtime effect | Security | P2 | A role with `permissions: []`, and a user holding that role | — | 1. Strip the role to no permissions.<br>2. Call any protected-sounding endpoint such as `POST /api/tickets` or `POST /api/users`. | Every call still succeeds. No controller, filter or middleware reads `Role.Permissions`, so the story configures data that governs nothing. **This case is expected to fail against story 46's intent** — evidence for GAP-136. | Not Run |
| TC-46-011 | A user's effective permissions cannot be queried | Negative | P2 | A user holding a role with permissions | — | 1. `GET /api/users/{id}`.<br>2. Look for the permission list. | `UserResponse` carries `roleId` and `roleName` but no permissions. A client wanting to hide unavailable actions must fetch the role separately, and there is no route listing roles to make that discoverable (GAP-132). | Not Run |
| TC-46-012 | Anyone can grant themselves any permission | Security | P2 | An existing role | `{"permissions":["admin.all","*"]}` | 1. `PATCH /api/roles/{id}/permissions` with no credentials. | Currently `200 OK`. An unauthenticated caller can rewrite any role's privileges. Inert today because of TC-46-010, but this route and `POST /api/users` together form a complete privilege-escalation path that must be closed in the same change that introduces enforcement. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-46-001, TC-46-002, TC-46-003 | Data is stored correctly; it simply has no effect |
| AC-2 Invalid input → 400 | TC-46-004 | TC-46-006 shows the values themselves are unvalidated |
| AC-3 Not found | TC-46-005 | |
| AC-4 Authorization → 401/403 | TC-46-012 | Blocked, GAP-01 |
| Story intent — permissions govern access | TC-46-010 | Expected to fail — GAP-136 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-134 | Permission strings are unvalidated free text with no vocabulary, so typos are stored silently and would deny access once enforcement exists. |
| GAP-135 | The `permission_change` audit entry records neither the old nor the new permission set, nor who made the change. |
| GAP-136 | Nothing in the codebase reads `Role.Permissions`. Permissions are configured but never enforced, so story 46 has no runtime effect. |
