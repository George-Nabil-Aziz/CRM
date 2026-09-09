# Test Cases — 38 Access FAQs

| | |
|---|---|
| **Story** | [`stories/38-access-faqs-portal`](../../../stories/38-access-faqs-portal/story.md) |
| **Spec** | [`specs/38-access-faqs-portal`](../../../specs/38-access-faqs-portal/spec.md) |
| **Area** | Customer Portal |
| **Priority** | P3 |
| **Endpoints** | `GET /api/portal/kb?q=` |
| **Implementation** | [`PortalController.cs`](../../../backend/CrmApi/Controllers/PortalController.cs) |

## This route is browse and search in one

| | `GET /api/kb/faqs` | `GET /api/kb/search` | `GET /api/portal/kb` |
|---|---|---|---|
| Type filter | `Faq` only | None | **None** |
| Published filter | Yes | Yes | Yes |
| Query | Not supported | **Required** — absent `q` is `400` | **Optional** — absent `q` lists everything |
| Empty `q` | — | Returns `[]` | **Returns everything** |

That last row is the important difference. On `/api/kb/search` a blank query short-circuits to an
empty list; here a blank query falls through to the unfiltered list. Same guard expression,
opposite outcome, because this route starts from "all published" rather than "nothing".

Despite the story title, the route is not FAQ-specific — it returns articles and guides too.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-38-001 | Browse the portal knowledge base | Positive | P3 | 4 published articles, one per `ArticleType` plus one extra | No query string | 1. `GET /api/portal/kb`. | `200 OK` with all 4 as summaries — `id`, `title`, `category`, `type`. No bodies. | Not Run |
| TC-38-002 | Articles and guides are included, not just FAQs | Positive | P3 | One published item of each `ArticleType` | — | 1. `GET /api/portal/kb`. | All three types appear. Unlike `/api/kb/faqs`, this route applies no type filter, so the story title "Access FAQs" understates what it returns. Confirm the portal UI labels it accurately. | Not Run |
| TC-38-003 | Search by keyword | Positive | P3 | A published article titled `Resetting your password` | `?q=password` | 1. `GET /api/portal/kb?q=password`. | `200 OK` and the article is returned. | Not Run |
| TC-38-004 | Search matches the body as well as the title | Positive | P3 | An article whose body, but not title, contains `invoice` | `?q=invoice` | 1. `GET /api/portal/kb?q=invoice`. | The article is returned — the same double-column `LIKE` as `/api/kb/search`. | Not Run |
| TC-38-005 | An empty query returns everything | Edge | P3 | 5 published articles | `?q=`, then `?q=%20` | 1. `GET` once per value.<br>2. Count the results. | All 5 both times — the opposite of `/api/kb/search`, which returns `[]` for a blank query. A portal search box that fires on every keystroke will therefore dump the full list when the user clears it. Verify the UI handles that. | Not Run |
| TC-38-006 | An omitted query is valid | Positive | P3 | Published articles exist | No query string | 1. `GET /api/portal/kb`. | `200 OK` with the full list — `q` is `string?`, so unlike `/api/kb/search` an absent parameter is not a `400`. | Not Run |
| TC-38-007 | A query with no matches | Edge | P3 | `SEED-KB` | `?q=zzzznotfound` | 1. `GET`. | `200 OK` with `[]`. | Not Run |
| TC-38-008 | Unpublished drafts never appear | Positive | P3 | 2 published articles and 2 drafts, all matching the query | `?q=password` | 1. `GET /api/portal/kb?q=password`. | Only the 2 published ones. Drafts cannot reach customers through the portal — the most important assertion in this file. | Not Run |
| TC-38-009 | An empty knowledge base returns an empty list | Edge | P3 | `SEED-EMPTY` | — | 1. `GET /api/portal/kb`. | `200 OK` with `[]`. The portal must render this as an empty state, not an error. | Not Run |
| TC-38-010 | A customer cannot read an article body from the portal | Negative | P3 | A published article | Its id | 1. `GET /api/portal/kb` and take an `id`.<br>2. Look for a portal route returning that article's body. | There is none. The only route serving a body is `GET /api/kb/articles/{id}`, which is not under `/api/portal`. The portal can therefore list article titles but not display an article — story 38 is a list without a reader. Evidence for GAP-114. | Not Run |
| TC-38-011 | Results are unordered | Edge | P3 | 5 published articles | — | 1. `GET /api/portal/kb` several times.<br>2. Compare the sequences. | No `OrderBy` is applied, so the order is unstable across calls and unrelated to relevance or popularity. Same root cause as GAP-39. | Not Run |
| TC-38-012 | Results are unbounded | Edge | P3 | 500 published articles | No query string | 1. `GET /api/portal/kb`. | All 500 summaries are returned. No cap, no paging — the browse case is the worst of the three knowledge-base routes because the default is "everything". Raise as a performance defect. | Not Run |
| TC-38-013 | A multi-word query is matched literally | Edge | P3 | An article whose body contains `reset your password` | `?q=reset password` | 1. `GET /api/portal/kb?q=reset%20password`. | No match — the phrase is one `LIKE` pattern, so the words must be adjacent in that order. Customers type natural phrases, so this fails often — GAP-86. | Not Run |
| TC-38-014 | Arabic content is searchable | Edge | P3 | A published article whose body is Arabic | An Arabic substring, URL-encoded | 1. `GET /api/portal/kb?q={arabic}`. | The article is returned, confirming `LIKE` works over Unicode. The portal half of story 53. | Not Run |
| TC-38-015 | The endpoint is public | Security | P3 | API running | No credentials | 1. `GET /api/portal/kb` with no `Authorization` header. | `200 OK`. Correct for customer self-service, and unlike the other portal routes this one exposes no customer data — the `Published` filter is the whole access control. Record as verified. | Not Run |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-38-001, TC-38-003, TC-38-008 | |
| AC-2 Invalid input → 400 | TC-38-006 | `q` is optional, so there is no invalid input to reject |
| AC-3 Not found | TC-38-007, TC-38-009 | An empty result returns `[]` |
| AC-4 Authorization | TC-38-015 | Intentionally public |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-39 | Results have no ordering, so the sequence is unstable. |
| GAP-86 | Multi-word queries are matched as one literal phrase. |
| GAP-114 | The portal can list articles but has no route to read one, so customers cannot open the content they find. |
| GAP-115 | `GET /api/portal/kb` returns every published article by default, with no cap or paging. |
