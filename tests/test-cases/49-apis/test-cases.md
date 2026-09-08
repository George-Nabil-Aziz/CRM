# Test Cases — 49 APIs

| | |
|---|---|
| **Story** | [`stories/49-apis`](../../../stories/49-apis/story.md) |
| **Spec** | [`specs/49-apis`](../../../specs/49-apis/spec.md) |
| **Area** | Integrations |
| **Priority** | P4 |
| **Endpoints** | `POST /api/integrations/apikeys`, `GET /api/integrations/apikeys/{id}` |
| **Implementation** | [`IntegrationsController.cs`](../../../backend/CrmApi/Controllers/IntegrationsController.cs) |

## Keys are issued but never checked

A key is 24 cryptographically random bytes rendered as 48 hex characters — a sound value. What
is missing is everything around it:

| | Status |
|---|---|
| Key generation | `RandomNumberGenerator.GetBytes(24)` — good |
| Key **verification** on any request | **None.** No middleware, filter or handler reads `ApiKeys` |
| Scope enforcement | **None** — scopes are free-text strings nothing consults |
| Storage | **Plaintext**, and returned in full on every read |
| Revocation | **None** — no delete, no expiry, no disable |

So a key can be issued, but presenting it does nothing and omitting it costs nothing. This is
the same root cause as GAP-01, seen from the machine-to-machine side.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-49-001 | Issue an API key with scopes | Positive | P4 | API running | `{"ownerId":"<uuid>","scopes":["tickets.read","customers.read"]}` | 1. `POST /api/integrations/apikeys`. | `201 Created` with a generated `id`, a `key`, the `ownerId`, the scopes and a UTC `createdAt`. | Not Run |
| TC-49-002 | The key is 48 hex characters | Positive | P4 | API running | A valid payload | 1. `POST`.<br>2. Test the `key` against `^[0-9A-F]{48}$`. | It matches — 24 random bytes hex-encoded upper-case. | Not Run |
| TC-49-003 | Keys are unique and unpredictable | Positive | P4 | API running | The same payload twice | 1. `POST` twice.<br>2. Compare the two keys. | They differ. Issue 100 keys and confirm no collisions and no visible structure — the source is a CSPRNG, so this should hold. | Not Run |
| TC-49-004 | A key may be issued with no scopes | Edge | P4 | API running | `{"ownerId":"<uuid>"}` | 1. `POST`. | `201 Created` with `scopes: []` — the null coalesces to an empty list. Since scopes are never enforced, a scopeless key is exactly as powerful as any other. | Not Run |
| TC-49-005 | A missing owner id is rejected | Negative | P4 | API running | `{}` | 1. `POST`. | `400 Bad Request` naming `OwnerId`. | Not Run |
| TC-49-006 | The owner id is never validated | Negative | P4 | API running | A random UUID as `ownerId` | 1. `POST`. | `201 Created`. The id is not checked against the users table, so a key can be issued to nobody and could never be traced to a person. Same weakness as GAP-14. | Not Run |
| TC-49-007 | Fetch a key by id | Positive | P4 | TC-49-001 has passed | The key's id | 1. `GET /api/integrations/apikeys/{id}`. | `200 OK` with the full record. | Not Run |
| TC-49-008 | Fetch a key that does not exist | Negative | P4 | API running | A random UUID | 1. `GET /api/integrations/apikeys/{random-uuid}`. | `404 Not Found`. | Not Run |
| TC-49-009 | The secret is returned in plaintext on every read | Security | P4 | An issued key | Its id | 1. `GET /api/integrations/apikeys/{id}` repeatedly.<br>2. Inspect `key` each time. | The full secret comes back every time. A key should be shown **once** at creation and stored only as a hash thereafter; here it is stored in plaintext and retrievable forever by anyone who learns the key's id. Raise as a security defect — GAP-145. | Not Run |
| TC-49-010 | Presenting a key changes nothing | Negative | P4 | An issued key with `scopes: []` | The key value | 1. Call `GET /api/tickets` with the key in an `Authorization` or `X-Api-Key` header.<br>2. Call the same endpoint with **no** header. | Both succeed identically. No code path reads `ApiKeys`, so the key is inert. **Expected to fail against story 49's intent** — evidence for GAP-146. | Not Run |
| TC-49-011 | Scopes are unvalidated free text | Negative | P4 | API running | `{"ownerId":"<uuid>","scopes":["nonsense","*","DROP TABLE"]}` | 1. `POST`.<br>2. Read the key back. | All three are stored verbatim. There is no scope vocabulary and no validation — the same shape of problem as role permissions (GAP-134). | Not Run |
| TC-49-012 | Keys cannot be listed | Negative | P4 | Several keys issued | — | 1. Look for `GET /api/integrations/apikeys`. | There is none. An administrator cannot see which keys exist, so unused or forgotten keys are undiscoverable. Evidence for GAP-147. | Not Run |
| TC-49-013 | Keys cannot be revoked or expired | Security | P4 | An issued key | — | 1. Look for a delete, disable or expiry route.<br>2. Inspect the `ApiKey` model. | There is no route and no expiry or revoked field. Once issued, a key exists forever with no way to withdraw it — which becomes serious the moment keys are actually enforced. Evidence for GAP-147. | Not Run |
| TC-49-014 | No rate limiting is applied per key | Edge | P4 | An issued key | — | 1. Issue 500 rapid requests. | All succeed. There is no throttling, per key or otherwise, anywhere in the API — pair this with GAP-63 on the public write endpoints. | Not Run |
| TC-49-015 | Anyone can issue a key | Security | P4 | API running | Any valid payload | 1. `POST /api/integrations/apikeys` with no credentials. | Currently `201 Created`. Issuing credentials is itself an unauthenticated operation. Inert today because of TC-49-010, but this route must be protected in the same change that introduces key verification. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-49-001, TC-49-002, TC-49-007 | Issuance works; the key does nothing |
| AC-2 Invalid input → 400 | TC-49-005 | TC-49-006 and TC-49-011 show the values are unvalidated |
| AC-3 Not found | TC-49-008 | |
| AC-4 Authorization → 401/403 | TC-49-015 | Blocked, GAP-01 |
| Story intent — programmatic access control | TC-49-010 | Expected to fail — GAP-146 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-145 | API keys are stored in plaintext and returned in full on every read, rather than shown once and stored as a hash. |
| GAP-146 | No code path verifies an API key or its scopes, so issued keys grant and restrict nothing. |
| GAP-147 | Keys cannot be listed, revoked or expired. |
