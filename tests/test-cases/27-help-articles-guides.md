# Test Cases — 27 Read help articles and guides

| | |
|---|---|
| **Story** | [`stories/27-help-articles-guides`](../../../stories/27-help-articles-guides/story.md) |
| **Spec** | [`specs/27-help-articles-guides`](../../../specs/27-help-articles-guides/spec.md) |
| **Area** | Knowledge Base |
| **Priority** | P3 |
| **Endpoints** | `GET /api/kb/articles/{id}` |
| **Implementation** | [`ArticlesController.cs`](../../../backend/CrmApi/Controllers/ArticlesController.cs) |
| **UI** | [`knowledge-base.page.ts`](../../../frontend/src/app/pages/knowledge-base.page.ts) |

## This is the only route that returns a body

Every other knowledge-base route returns summaries. This one returns the full `ArticleResponse`
including `body`, `published` and `viewCount` — and it is also the only route with a **side
effect**: each successful read increments `ViewCount` and saves.

An unpublished article returns `404`, identical to an article that does not exist, so a draft's
existence is never disclosed.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-27-001 | Open a published article by id | Positive | P3 | A published article | Its id | 1. `GET /api/kb/articles/{id}`. | `200 OK` with `id`, `title`, the full `body`, `category`, `type`, `published: true` and `viewCount`. | Not Run |
| TC-27-002 | All three article types are readable | Positive | P3 | One published item of each `ArticleType` | Each id in turn | 1. `GET /api/kb/articles/{id}` once per item. | `200 OK` each time, with `type` reading `Faq`, `Article` or `Guide` respectively. Unlike the FAQ list, this route does not filter on type. | Not Run |
| TC-27-003 | Reading increments the view count | Positive | P3 | A published article with `viewCount` 0 | — | 1. `GET /api/kb/articles/{id}` three times.<br>2. Read `viewCount` from each response. | The counter rises by one per call, and the third response already shows `3` — the increment is saved before the response is built, so a reader sees their own view included. | Not Run |
| TC-27-004 | An article that does not exist | Negative | P3 | API running | A random UUID | 1. `GET /api/kb/articles/{random-uuid}`. | `404 Not Found`. | Not Run |
| TC-27-005 | An unpublished article is not served | Negative | P3 | A draft article | Its id | 1. `GET /api/kb/articles/{draft-id}`. | `404 Not Found` — byte-identical to the missing-article response, so a draft's existence is not disclosed to a reader who guesses its id. Record as verified. | Not Run |
| TC-27-006 | A failed read does not increment the counter | Edge | P3 | A draft article | Its id | 1. `GET /api/kb/articles/{draft-id}` several times.<br>2. Publish it and read `viewCount`. | The counter is 0 at publication — the increment happens only after the published check passes. | Not Run |
| TC-27-007 | Authors cannot preview their own drafts | Negative | P3 | A draft article | Its id | 1. Try to read the draft through any route in the API. | No route serves it — not this one, not search, not the FAQ list, not the portal. An author must publish an article to see how it reads, which makes review before publication impossible. Evidence for GAP-34. | Not Run |
| TC-27-008 | A malformed id is rejected | Negative | P3 | API running | `/api/kb/articles/not-a-guid` | 1. `GET`. | `404 Not Found` — the `{id:guid}` route constraint fails to match, so the request never reaches the action. Note this is `404`, not `400`. | Not Run |
| TC-27-009 | Concurrent reads may lose increments | Edge | P3 | A published article with a known `viewCount` | — | 1. Issue 20 simultaneous `GET` requests.<br>2. Compare the final `viewCount` with the expected +20. | The final count may be lower. `ViewCount++` is a read-modify-write with no concurrency token, so simultaneous reads overwrite one another. Low impact, but the metric is approximate — record the actual drift. | Not Run |
| TC-27-010 | Every read performs a database write | Edge | P3 | A published article | — | 1. Read the article repeatedly under load.<br>2. Observe database write activity. | Each read issues a `SaveChangesAsync`. A popular article therefore turns a read-only page view into a write on every hit, which will not scale and makes read replicas unusable for this route. Raise as a design defect. | Not Run |
| TC-27-011 | Article bodies are returned unescaped | Edge | P3 | A published article whose body contains `<b>bold</b>` and `<script>alert(1)</script>` | — | 1. `GET /api/kb/articles/{id}`. | The body returns verbatim with no escaping. Correct for an API, but since knowledge-base content is authored through `POST /api/kb/articles` — itself unauthenticated — output encoding in the UI is mandatory. Pair with the knowledge-base UI test. | Not Run |
| TC-27-012 | Arabic content round-trips cleanly | Edge | P3 | A published article whose body is Arabic | — | 1. `GET /api/kb/articles/{id}`. | The text returns byte-identical with no mojibake. This is the knowledge-base half of story 53. | Not Run |
| TC-27-013 | The endpoint is public | Security | P3 | API running | A published article id | 1. `GET /api/kb/articles/{id}` with no credentials. | `200 OK`. Intended for customer self-service, with `Published` as the access control. Re-confirm once auth lands that this route stays anonymous. | Not Run |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-27-001, TC-27-002, TC-27-003 | |
| AC-2 Invalid input → 400 | TC-27-008 | Returns `404` via the route constraint, not `400` |
| AC-3 Not found | TC-27-004, TC-27-005 | |
| AC-4 Authorization | TC-27-013 | Intentionally public |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-34 | Drafts cannot be previewed through any route, so review before publication is impossible. |
| GAP-85 | Every article read performs a database write to increment `ViewCount`, which prevents read scaling and makes the counter lossy under concurrency. |
