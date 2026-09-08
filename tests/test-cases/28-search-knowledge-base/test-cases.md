# Test Cases — 28 Search the knowledge base

| | |
|---|---|
| **Story** | [`stories/28-search-knowledge-base`](../../../stories/28-search-knowledge-base/story.md) |
| **Spec** | [`specs/28-search-knowledge-base`](../../../specs/28-search-knowledge-base/spec.md) |
| **Area** | Knowledge Base |
| **Priority** | P3 |
| **Endpoints** | `GET /api/kb/search?q=` |
| **Implementation** | [`ArticlesController.cs`](../../../backend/CrmApi/Controllers/ArticlesController.cs) |
| **UI** | [`knowledge-base.page.ts`](../../../frontend/src/app/pages/knowledge-base.page.ts) — a search box firing on every keystroke |

## What the search actually is

```
where Published && (Title LIKE '%q%' || Body LIKE '%q%')
```

A double-sided `LIKE` against two columns. There is no ranking, no stemming, no tokenising and
no result limit. A blank or whitespace-only `q` short-circuits to an empty list before the query
runs; an **omitted** `q` is a `400`, because the project enables nullable reference types and
`[ApiController]` treats the non-nullable `string q` as required.

Spec 28 names only `title` as searchable — the implementation also searches the body, a
deviation in the user's favour that is worth recording.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-28-001 | Search matches on the title | Positive | P3 | A published article titled `Resetting your password` | `?q=password` | 1. `GET /api/kb/search?q=password`. | `200 OK` and the article is returned as a summary — `id`, `title`, `category`, `type`, with no body. | Not Run |
| TC-28-002 | Search also matches on the body | Positive | P3 | An article whose body, but not title, contains `invoice` | `?q=invoice` | 1. `GET /api/kb/search?q=invoice`. | The article is returned. Broader than spec 28 specifies — record the deviation. | Not Run |
| TC-28-003 | Matching is a substring, not a prefix | Positive | P3 | An article titled `Resetting your password` | `?q=sett` | 1. `GET /api/kb/search?q=sett`. | The article is returned — the pattern is `%q%`, so a fragment from the middle of a word matches. | Not Run |
| TC-28-004 | All three article types are searchable | Positive | P3 | One published item of each type, all containing `refund` | `?q=refund` | 1. `GET /api/kb/search?q=refund`. | All three are returned. Unlike the FAQ list, search does not filter on type. | Not Run |
| TC-28-005 | Unpublished articles never appear | Positive | P3 | A draft whose title contains `password` | `?q=password` | 1. `GET /api/kb/search?q=password`. | The draft is absent. Search cannot be used to discover unreleased content. | Not Run |
| TC-28-006 | A query with no matches | Edge | P3 | `SEED-KB` | `?q=zzzznotfound` | 1. `GET`. | `200 OK` with `[]`, not `404`. | Not Run |
| TC-28-007 | An empty query returns nothing | Edge | P3 | `SEED-KB` with several published articles | `?q=` | 1. `GET /api/kb/search?q=`. | `200 OK` with `[]` — the guard returns early rather than listing the entire knowledge base. Important, because the UI fires a search on every keystroke including deletion back to empty. | Not Run |
| TC-28-008 | A whitespace-only query returns nothing | Edge | P3 | `SEED-KB` | `?q=%20%20` | 1. `GET`. | `200 OK` with `[]` — the guard is `IsNullOrWhiteSpace`. | Not Run |
| TC-28-009 | A missing `q` parameter is rejected | Negative | P3 | API running | No query string | 1. `GET /api/kb/search`. | `400 Bad Request`. Nullable reference types are enabled, so the non-nullable `string q` is implicitly required. Note the asymmetry: a blank `q` is `200`, an absent `q` is `400`. | Not Run |
| TC-28-010 | Percent and underscore are not treated as wildcards | Edge | P3 | An article containing a literal `%`, and several that do not | `?q=%25`, then `?q=_` | 1. `GET` once per value.<br>2. Count the results. | Only articles genuinely containing those characters are returned. If `%` matches everything, `EF.Functions.Like` is passing the input through unescaped and any user can dump the whole knowledge base with a one-character query — raise it as a defect. | Not Run |
| TC-28-011 | Matching is case-insensitive under the default collation | Edge | P3 | An article titled `Resetting your password` | `?q=PASSWORD` | 1. `GET /api/kb/search?q=PASSWORD`. | The article is returned under a case-insensitive SQL Server collation. Record the actual result — if the deployment uses a case-sensitive collation, search silently stops working for capitalised queries. | Not Run |
| TC-28-012 | A multi-word query is matched literally | Edge | P3 | An article whose body contains `reset your password` | `?q=reset password` | 1. `GET /api/kb/search?q=reset%20password`. | **No match** — the whole phrase is one `LIKE` pattern, so the words must be adjacent in that exact order. There is no tokenising, so natural queries typed by customers will frequently return nothing. Raise as a functional defect — GAP-86. | Not Run |
| TC-28-013 | Results are unranked | Edge | P3 | One article with the term in its title, another with it buried in a long body | `?q=password` | 1. `GET`.<br>2. Inspect the order. | Both are returned in unspecified database order. A title match is not ranked above a body match, and `ViewCount` is not used, so the most relevant article may appear last. Raise as a defect. | Not Run |
| TC-28-014 | Results are unbounded | Edge | P3 | 500 published articles all containing `the` | `?q=the` | 1. `GET /api/kb/search?q=the`. | All 500 summaries are returned in one response. No limit, no paging. Combined with the per-keystroke UI search this is a real load concern — raise as a performance defect. | Not Run |
| TC-28-015 | Arabic search terms match Arabic content | Edge | P3 | A published article whose body is Arabic | An Arabic substring as `q` | 1. `GET /api/kb/search?q={arabic}` with the term URL-encoded. | The article is returned. Confirms `LIKE` matching works over Unicode content — the search half of story 53. | Not Run |
| TC-28-016 | A very long query is handled safely | Edge | P3 | `SEED-KB` | A 5,000-character `q` | 1. `GET`. | Either `[]` or a clean `4xx`. No `500`, and no unhandled exception from URL length limits — record which occurs. | Not Run |
| TC-28-017 | The endpoint is public | Security | P3 | API running | Any query | 1. `GET /api/kb/search?q=password` with no credentials. | `200 OK`. Intended for customer self-service, protected by the `Published` filter. Re-confirm once auth lands. | Not Run |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-28-001, TC-28-002, TC-28-003 | Body search exceeds what the spec asks for |
| AC-2 Invalid input → 400 | TC-28-009 | |
| AC-3 Not found | TC-28-006 | An empty match returns `[]` |
| AC-4 Authorization | TC-28-017 | Intentionally public |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-86 | A multi-word query is matched as one literal phrase, so ordinary natural-language searches return nothing. |
| GAP-87 | Results are neither ranked nor limited — a title match ranks no higher than a body match, and every match is returned. |
| GAP-88 | Behaviour with `%` and `_` in the query needs confirming; if unescaped, a one-character query dumps the whole knowledge base. |
