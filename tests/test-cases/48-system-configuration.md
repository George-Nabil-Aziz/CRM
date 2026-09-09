# Test Cases — 48 System configuration

| | |
|---|---|
| **Story** | [`stories/48-system-configuration`](../../../stories/48-system-configuration/story.md) |
| **Spec** | [`specs/48-system-configuration`](../../../specs/48-system-configuration/spec.md) |
| **Area** | Security & Administration |
| **Priority** | P2 |
| **Endpoints** | `PATCH /api/settings`, `GET /api/settings/{key}` |
| **Implementation** | [`SettingsController.cs`](../../../backend/CrmApi/Controllers/SettingsController.cs) |

## An untyped key–value store

`SystemSetting` is `{ Key (primary key), Value }` — both strings. `PATCH` is an upsert: find by
key, insert if absent, overwrite if present. There is no key vocabulary, no value typing and no
schema, so any caller can invent any key.

Nothing in the product reads these settings. Like story 46's permissions, the data is stored
faithfully and governs nothing.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-48-001 | Set a value and read it back | Positive | P2 | No setting with key `support.email` | `{"key":"support.email","value":"help@azm.com"}` | 1. `PATCH /api/settings`.<br>2. `GET /api/settings/support.email`. | `200 OK` from both, returning the key and value exactly as submitted. | Not Run |
| TC-48-002 | Setting an existing key overwrites it | Edge | P2 | `support.email` is set to `old@azm.com` | `{"key":"support.email","value":"new@azm.com"}` | 1. `PATCH`.<br>2. `GET /api/settings/support.email`.<br>3. Count rows for that key. | `200 OK` with the new value, and exactly one row — the upsert updates rather than inserting a duplicate. | Not Run |
| TC-48-003 | Upsert returns 200, not 201, on first write | Edge | P2 | No setting with key `new.key` | `{"key":"new.key","value":"x"}` | 1. `PATCH /api/settings`. | `200 OK` even though a row was created. There is no `201` and no `Location` header — unusual for a creating call, but consistent for an upsert. Record it so clients do not assert on `201`. | Not Run |
| TC-48-004 | Reading a key that was never set | Negative | P2 | API running | `GET /api/settings/never.set` | 1. `GET`. | `404 Not Found`. | Not Run |
| TC-48-005 | An empty key is rejected | Negative | P2 | API running | `{"key":"","value":"x"}` | 1. `PATCH`. | `400 Bad Request` naming `Key`. | Not Run |
| TC-48-006 | An empty value is accepted | Edge | P2 | API running | `{"key":"feature.flag","value":""}` | 1. `PATCH`.<br>2. `GET /api/settings/feature.flag`. | `200 OK` with `value: ""`. `Value` is `[Required]` but carries no `MinLength`, so an empty string is valid — the way to "clear" a setting, since there is no delete route. | Not Run |
| TC-48-007 | A missing value is rejected | Negative | P2 | API running | `{"key":"feature.flag"}` | 1. `PATCH`. | `400 Bad Request` naming `Value` — note the asymmetry with TC-48-006: absent is invalid, empty is fine. | Not Run |
| TC-48-008 | Any key name is accepted | Negative | P2 | API running | `{"key":"totally.made.up.key","value":"1"}`, then a 500-character key | 1. `PATCH` once per case. | Both stored. There is no key vocabulary and no length guard beyond the column definition, so typos create silent orphan settings rather than errors, and no consumer would ever read them. Raise as a defect — GAP-141. | Not Run |
| TC-48-009 | Keys with URL-significant characters | Edge | P3 | API running | Keys containing `/`, `?` and a space | 1. `PATCH` each key.<br>2. Attempt `GET /api/settings/{key}` for each, URL-encoded. | The `PATCH` succeeds for all three, but the `GET` route template is `{key}` with no catch-all, so a key containing `/` cannot be read back at all. A setting can be written and then become permanently unreadable. Raise as a defect — GAP-142. | Not Run |
| TC-48-010 | Key matching is case-sensitive | Edge | P3 | `support.email` is set | `GET /api/settings/Support.Email` | 1. `GET`. | Verify against the database collation. Under a case-insensitive one this returns the value; under a case-sensitive one it is `404` and `PATCH` with different casing would create a **second** setting. Record the actual behaviour — the ambiguity itself is the risk. | Not Run |
| TC-48-011 | Settings cannot be listed | Negative | P2 | Several settings exist | — | 1. Look for `GET /api/settings` without a key. | There is none — the only read requires knowing the key in advance. An administration UI cannot render a settings page, and nobody can discover what has been configured. Evidence for GAP-143. | Not Run |
| TC-48-012 | Settings cannot be deleted | Negative | P2 | An existing setting | — | 1. Look for a `DELETE` route. | There is none. A mistyped key from TC-48-008 is permanent, and the only way to neutralise a setting is to blank its value. Evidence for GAP-143. | Not Run |
| TC-48-013 | Changes are audited but not identifiably | Positive | P2 | API running | Two different settings, changed in turn | 1. `PATCH` twice with different keys.<br>2. `GET /api/audit-logs?targetType=setting`. | Two entries with action `update`, but both carry `targetId` `Guid.Empty` and no key, so the log records *that* configuration changed and never *which* setting or *to what*. Evidence for GAP-139. | Not Run |
| TC-48-014 | Settings have no runtime effect | Negative | P2 | API running | Any plausible key such as `sla.default.minutes` or `support.email` | 1. Set the value.<br>2. Exercise the behaviour it names — create a ticket, trigger the SLA monitor, send a notification. | Nothing changes. No service reads `SystemSettings`; every threshold in the product is a hard-coded constant — the SLA monitor's 1-minute tick and 15-minute warning window, for example. Story 48 stores configuration that configures nothing. **Expected to fail against the story's intent** — GAP-144. | Not Run |
| TC-48-015 | Branding settings live elsewhere | Edge | P3 | API running | — | 1. Compare `PATCH /api/settings` with `PATCH /api/settings/branding`. | Branding is handled by `PlatformController` against a separate typed model (story 57), not through this key–value store, despite sharing the `/api/settings` prefix. Two unrelated configuration mechanisms under one path — flag the inconsistency. | Not Run |
| TC-48-016 | Anyone can change system configuration | Security | P2 | API running | Any key and value | 1. `PATCH /api/settings` with no `Authorization` header. | Currently `200 OK`. Inert today because of TC-48-014, but this route must be locked down in the same change that makes settings meaningful — otherwise it becomes a way to reconfigure the system anonymously. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-48-001, TC-48-002 | |
| AC-2 Invalid input → 400 | TC-48-005, TC-48-007 | TC-48-008 shows key names themselves are unvalidated |
| AC-3 Not found | TC-48-004 | |
| AC-4 Authorization → 401/403 | TC-48-016 | Blocked, GAP-01 |
| Story intent — configuration governs behaviour | TC-48-014 | Expected to fail — GAP-144 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-139 | Setting audit entries log `Guid.Empty` and no key, so they cannot identify which setting changed. |
| GAP-141 | Keys are unvalidated free text with no vocabulary, so typos create permanent orphan settings. |
| GAP-142 | A key containing `/` can be written but never read back — the `GET` route template has no catch-all. |
| GAP-143 | Settings cannot be listed or deleted, so no administration UI can render them and a mistake cannot be removed. |
| GAP-144 | Nothing in the product reads `SystemSettings`. Every threshold is hard-coded, so configuration has no runtime effect. |
