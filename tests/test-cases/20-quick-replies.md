# Test Cases — 20 Use quick replies

| | |
|---|---|
| **Story** | [`stories/20-quick-replies`](../../../stories/20-quick-replies/story.md) |
| **Spec** | [`specs/20-quick-replies`](../../../specs/20-quick-replies/spec.md) |
| **Area** | Agent Dashboard |
| **Priority** | P2 |
| **Endpoints** | `GET /api/quick-replies?category=`, `POST /api/quick-replies` |
| **Implementation** | [`QuickRepliesController.cs`](../../../backend/CrmApi/Controllers/QuickRepliesController.cs) |

## Category is a free-text string, not the ticket enum

`QuickReply.Category` is a nullable `string` compared with plain equality — it is **not**
`TicketCategory`. So `billing` and `Billing` are different categories, and any spelling is
accepted. Several cases below probe the consequences.

The story is "use quick replies", but note what "use" amounts to: the API stores and lists
canned text. There is no route that sends a reply, so an agent copies the body out of the list
and pastes it wherever they are actually replying.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-20-001 | List all quick replies | Positive | P2 | 3 quick replies exist | — | 1. `GET /api/quick-replies`. | `200 OK` with all 3, each carrying `id`, `title`, `body` and `category`. | Not Run |
| TC-20-002 | Create a quick reply | Positive | P2 | API running | `{"title":"Awaiting customer","body":"We are waiting on your reply before we can continue.","category":"general"}` | 1. `POST /api/quick-replies`. | `201 Created` with a generated `id` and the submitted values echoed back. | Not Run |
| TC-20-003 | A new reply appears in the list | Positive | P2 | TC-20-002 has passed | — | 1. `GET /api/quick-replies`. | The new reply is present with its full `body`, not a summary. | Not Run |
| TC-20-004 | Filter by category | Positive | P2 | Replies in two categories | `?category=billing` | 1. `GET /api/quick-replies?category=billing`. | Only replies whose `category` equals `billing` exactly are returned. | Not Run |
| TC-20-005 | An empty category filter is ignored | Edge | P2 | 3 replies exist, one with a null category | `?category=`, then `?category=%20` | 1. `GET` once per value. | All 3 are returned both times — the guard is `IsNullOrWhiteSpace`, so a blank filter falls through to the unfiltered list rather than matching blank categories. | Not Run |
| TC-20-006 | A reply may be created with no category | Edge | P2 | API running | `{"title":"Thanks","body":"Thank you for your patience."}` | 1. `POST`.<br>2. `GET /api/quick-replies`. | `201 Created` with `category: null`, and the reply appears in the unfiltered list. | Not Run |
| TC-20-007 | An uncategorised reply is unreachable by filter | Edge | P2 | A reply with `category: null` | Any category filter value | 1. `GET /api/quick-replies?category=general`. | The uncategorised reply is absent. There is no way to filter *for* null, so uncategorised replies are only visible in the full list. | Not Run |
| TC-20-008 | The category filter is case-sensitive | Edge | P3 | A reply stored with category `billing` | `?category=Billing` | 1. `GET /api/quick-replies?category=Billing`. | Returns `[]` under a case-sensitive collation. Callers must match the stored casing exactly, and nothing enforces a convention at write time. Raise as a usability defect — GAP-27. | Not Run |
| TC-20-009 | An empty title is rejected | Negative | P2 | API running | `{"title":"","body":"x"}` | 1. `POST`. | `400 Bad Request` naming `Title`. | Not Run |
| TC-20-010 | An empty body is rejected | Negative | P2 | API running | `{"title":"x","body":""}` | 1. `POST`. | `400 Bad Request` naming `Body`. | Not Run |
| TC-20-011 | An omitted title or body is rejected | Negative | P2 | API running | `{"body":"x"}`, then `{"title":"x"}` | 1. `POST` once per case. | `400 Bad Request` each time. | Not Run |
| TC-20-012 | Duplicate titles are allowed | Edge | P3 | A reply titled `Awaiting customer` exists | The identical payload | 1. `POST` again.<br>2. `GET /api/quick-replies`. | `201 Created` and two identically titled replies now appear. There is no uniqueness constraint, so an agent picking from the list cannot tell them apart. Raise as a defect. | Not Run |
| TC-20-013 | The list is unordered | Edge | P3 | 5 quick replies | — | 1. `GET /api/quick-replies` several times. | No `OrderBy` is applied, so the sequence is whatever the database returns and may vary. A picker UI cannot present a stable list, and there is no alphabetical or most-used ordering. Raise as a defect. | Not Run |
| TC-20-014 | Quick replies cannot be edited or deleted | Negative | P2 | An existing reply with a typo | — | 1. Look for update or delete routes. | There are none. A reply with a mistake in it is permanent and, combined with TC-20-012, the only remedy is to add a corrected duplicate. Evidence for GAP-69. | Not Run |
| TC-20-015 | Placeholders are not substituted | Edge | P3 | A reply whose body contains `Hello {{customerName}},` | — | 1. `GET /api/quick-replies`.<br>2. Inspect the body. | The placeholder is returned as literal text. There is no templating and no ticket context, so an agent must edit every variable by hand. Confirm against the product intent of story 20. | Not Run |
| TC-20-016 | Unauthorized caller cannot create a quick reply | Security | P2 | Auth layer deployed | No credentials | 1. `POST` with no `Authorization` header. | `401 Unauthorized`. Until then anyone can inject canned text that agents may send to customers — worth noting as a content-integrity risk, not just an access one. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-20-001…004 | |
| AC-2 Invalid input → 400 | TC-20-009…011 | |
| AC-3 Not found / conflict | TC-20-012 | Duplicates are accepted rather than rejected |
| AC-4 Authorization → 401/403 | TC-20-016 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-27 | `Category` is an unvalidated, case-sensitive free-text string rather than the `TicketCategory` enum. |
| GAP-69 | Quick replies cannot be edited or deleted, and duplicate titles are permitted. |
| GAP-70 | The list applies no ordering, so a picker UI cannot show a stable sequence. |
| GAP-71 | Reply bodies support no placeholder substitution, so every variable must be edited by hand. |
