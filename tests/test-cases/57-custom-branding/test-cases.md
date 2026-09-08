# Test Cases — 57 Custom branding

| | |
|---|---|
| **Story** | [`stories/57-custom-branding`](../../../stories/57-custom-branding/story.md) |
| **Spec** | [`specs/57-custom-branding`](../../../specs/57-custom-branding/spec.md) |
| **Area** | Platform |
| **Priority** | P4 |
| **Contract says** | `POST /api/settings/branding` |
| **Implementation is** | `PATCH /api/settings/branding`, plus `GET /api/settings/branding` |
| **Code** | [`PlatformController.cs`](../../../backend/CrmApi/Controllers/PlatformController.cs) |

## A singleton row with partial updates

`PATCH` finds the first `BrandingConfig` row, creates one if none exists, and applies only the
non-null fields. `GET` returns the row, or a **default instance** if none has been saved — so
`GET` never returns `404`.

Two things to note before testing:

- The verb differs from the published contract (GAP-05).
- `UpdateBrandingRequest` has three nullable strings and **no validation attributes at all** —
  no `[Url]`, no colour format check, no length limit.

As with settings and permissions, nothing consumes this data: the Angular app carries no logo
element and no themed CSS variables.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-57-001 | Set all three branding values | Positive | P4 | No branding row exists | `{"logoUrl":"https://cdn.example.com/logo.png","primaryColor":"#1B4F9C","secondaryColor":"#F5A623"}` | 1. `PATCH /api/settings/branding`.<br>2. `GET /api/settings/branding`. | `200 OK` from both, returning all three values as submitted. | Not Run |
| TC-57-002 | The first call creates the singleton row | Positive | P4 | `SEED-EMPTY` | A valid payload | 1. `PATCH` once.<br>2. Count `BrandingConfigs` rows. | Exactly one row. The upsert creates it on first use. | Not Run |
| TC-57-003 | A second call updates rather than inserting | Edge | P4 | TC-57-001 has passed | `{"primaryColor":"#00A651"}` | 1. `PATCH`.<br>2. Count rows and read the values. | Still one row. `primaryColor` changed; `logoUrl` and `secondaryColor` keep their previous values — only non-null fields are applied. | Not Run |
| TC-57-004 | An empty body leaves branding unchanged | Edge | P4 | Branding is set | `{}` | 1. `PATCH`.<br>2. Read it back. | `200 OK` and nothing changed — all three fields are nullable and none is applied. | Not Run |
| TC-57-005 | An explicit null does not clear a value | Edge | P4 | `logoUrl` is set | `{"logoUrl":null}` | 1. `PATCH`.<br>2. Read it back. | The logo is unchanged. Null means "not supplied", so a logo can be replaced but never removed. Raise as a usability defect. | Not Run |
| TC-57-006 | An empty string does clear a value | Edge | P4 | `logoUrl` is set | `{"logoUrl":""}` | 1. `PATCH`.<br>2. Read it back. | `logoUrl` becomes `""`. The check is `is not null`, so an empty string is applied — this is the only way to remove a logo, and it is undocumented. | Not Run |
| TC-57-007 | Reading before anything is saved returns defaults | Edge | P4 | `SEED-EMPTY`, no `PATCH` performed | — | 1. `GET /api/settings/branding`. | `200 OK` — **not** `404` — with the `BrandingConfig` default values. Confirm what those defaults are: `PrimaryColor` and `SecondaryColor` are non-nullable in the response, so they must have model defaults. Record the actual values, since a client will render them. | Not Run |
| TC-57-008 | The contract verb does not match | Negative | P4 | API running | A valid payload | 1. `POST /api/settings/branding`. | `405 Method Not Allowed`. Spec 57's contract declares `POST`; only `PATCH` and `GET` are mapped. A client written against the contract fails. **Expected to fail against the spec** — GAP-05. | Not Run |
| TC-57-009 | The logo URL is not validated | Negative | P4 | API running | `{"logoUrl":"not-a-url"}`, then `{"logoUrl":"javascript:alert(1)"}` | 1. `PATCH` once per value.<br>2. Read them back. | Both are stored verbatim. `LogoUrl` carries no `[Url]` attribute, unlike the webhook URL which does. The `javascript:` value becomes a stored-script risk the moment a UI renders it as an image source or a link. Raise as a security defect — GAP-167. | Not Run |
| TC-57-010 | Colour values are not validated | Negative | P4 | API running | `{"primaryColor":"not-a-colour"}`, then `{"primaryColor":"</style><script>alert(1)</script>"}` | 1. `PATCH` once per value.<br>2. Read them back. | Both are stored verbatim. There is no hex, RGB or named-colour check. The second value is the dangerous one: a colour is destined for a stylesheet or an inline style, so unvalidated input here is a CSS injection vector. Raise as a security defect — GAP-167. | Not Run |
| TC-57-011 | Oversized values are accepted | Edge | P4 | API running | A 10,000-character `logoUrl` | 1. `PATCH`. | Either stored whole or a clean failure on a column limit. There is no `MaxLength`, so record which occurs — a silent truncation producing a broken URL would be worse than a rejection. | Not Run |
| TC-57-012 | Branding is applied nowhere in the UI | Negative | P4 | Branding set with a distinctive logo and colours | — | 1. Open every page in the Angular app.<br>2. Inspect the network calls and the rendered styles. | The app never requests `/api/settings/branding`, renders no logo element and uses no themed CSS variables. The configured branding has no visible effect anywhere. **Expected to fail against story 57's intent** — evidence for GAP-168. | Not Run |
| TC-57-013 | Branding is not applied to outbound content | Negative | P4 | Branding is set | — | 1. Check the webhook payloads and any outbound message path. | Nothing carries branding. There is no email templating and no outbound sending at all (GAP-18), so there is no customer-facing surface for branding to reach either. Follows from GAP-168. | Not Run |
| TC-57-014 | Branding changes are not audited | Negative | P4 | API running | A valid payload | 1. `PATCH`.<br>2. `GET /api/audit-logs`. | No entry. Note the inconsistency: `PATCH /api/settings` **is** audited by `SettingsController`, while `PATCH /api/settings/branding` — sharing the same URL prefix but living in `PlatformController` — is not. Two configuration mechanisms under one path with different behaviour. Raise as GAP-169. | Not Run |
| TC-57-015 | Anyone can change the branding | Security | P4 | API running | `{"logoUrl":"https://attacker.example.com/logo.png"}` | 1. `PATCH /api/settings/branding` with no credentials. | Currently `200 OK`. Inert today because of TC-57-012, but once branding is rendered this becomes an unauthenticated way to place arbitrary content and styles in front of every user — read together with GAP-167. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-57-001, TC-57-003 | Storage works; nothing consumes it |
| AC-2 Invalid input → 400 | TC-57-009, TC-57-010 | **No validation exists** — these cases document its absence |
| AC-3 Not found | TC-57-007 | `GET` returns defaults rather than `404` |
| AC-4 Authorization → 401/403 | TC-57-015 | Blocked, GAP-01 |
| Contract `POST /api/settings/branding` | TC-57-008 | Expected to fail — GAP-05 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-05 | The implementation uses `PATCH` where the published contract declares `POST`. |
| GAP-167 | `UpdateBrandingRequest` has no validation attributes at all. Unvalidated colour values are a CSS injection vector and an unvalidated logo URL accepts `javascript:` schemes. |
| GAP-168 | Nothing reads `BrandingConfig`. The Angular app has no logo element and no themed variables, so branding has no effect. |
| GAP-169 | `PATCH /api/settings` is audited but `PATCH /api/settings/branding` is not, despite sharing a URL prefix. |
