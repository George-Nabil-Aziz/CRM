# Test Cases — 26 Browse FAQs

| | |
|---|---|
| **Story** | [`stories/26-browse-faqs`](../../../stories/26-browse-faqs/story.md) |
| **Spec** | [`specs/26-browse-faqs`](../../../specs/26-browse-faqs/spec.md) |
| **Area** | Knowledge Base |
| **Priority** | P3 |
| **Endpoints** | `GET /api/kb/faqs?category=` |
| **Implementation** | [`ArticlesController.cs`](../../../backend/CrmApi/Controllers/ArticlesController.cs) |
| **UI** | [`knowledge-base.page.ts`](../../../frontend/src/app/pages/knowledge-base.page.ts) |

## Two filters are always applied

The route returns only rows where `Published == true` **and** `Type == Faq`. An optional
`category` narrows it further. The response is a **summary** — `id`, `title`, `category`,
`type` — with no body, so browsing a FAQ list always requires a second call to read one.

Note the category enum here is `ArticleCategory` (`GettingStarted`, `Billing`, `Technical`,
`Account`, `General`), which is **not** the same set as `TicketCategory` — it has
`GettingStarted` and lacks `FeatureRequest`.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-26-001 | List published FAQs | Positive | P3 | 3 published `Faq` articles | — | 1. `GET /api/kb/faqs`. | `200 OK` with 3 summaries, each carrying `id`, `title`, `category` and `type: "Faq"`. No `body` field is present. | Not Run |
| TC-26-002 | Unpublished FAQs are excluded | Positive | P3 | 2 published and 2 draft FAQs | — | 1. `GET /api/kb/faqs`. | Only the 2 published entries appear. | Not Run |
| TC-26-003 | Articles and guides are excluded | Positive | P3 | One published item of each `ArticleType` | — | 1. `GET /api/kb/faqs`. | Only the `Faq` item is returned — the route filters on type as well as publication. | Not Run |
| TC-26-004 | Filter by category | Positive | P3 | Published FAQs in `Billing` and `Technical` | `?category=Billing` | 1. `GET /api/kb/faqs?category=Billing`. | Only the `Billing` FAQs are returned. | Not Run |
| TC-26-005 | Every category value binds | Positive | P3 | One published FAQ per category | Each of the five values in turn | 1. `GET /api/kb/faqs?category={value}` once per value. | `200 OK` each time with the matching FAQ. Confirms `GettingStarted` binds from the string `"GettingStarted"`. | Not Run |
| TC-26-006 | An invalid category value is rejected | Negative | P3 | API running | `?category=Refunds` | 1. `GET /api/kb/faqs?category=Refunds`. | `400 Bad Request` — the value cannot bind to `ArticleCategory`. Note `FeatureRequest` is also invalid here even though it is a valid `TicketCategory`. | Not Run |
| TC-26-007 | An empty knowledge base returns an empty list | Edge | P3 | `SEED-EMPTY` | — | 1. `GET /api/kb/faqs`. | `200 OK` with `[]`. | Not Run |
| TC-26-008 | A category with no FAQs returns an empty list | Edge | P3 | Published FAQs exist only in `Billing` | `?category=Technical` | 1. `GET /api/kb/faqs?category=Technical`. | `200 OK` with `[]`, not `404`. | Not Run |
| TC-26-009 | The list is unordered | Edge | P3 | 5 published FAQs | — | 1. `GET /api/kb/faqs` several times.<br>2. Compare the sequences. | No `OrderBy` is applied, so the order is whatever the database returns and may change between calls. There is no alphabetical ordering and no popularity ordering, even though `ViewCount` is tracked on every article. Raise as a defect — GAP-39. | Not Run |
| TC-26-010 | The list is unbounded | Edge | P3 | 500 published FAQs | — | 1. `GET /api/kb/faqs`. | All 500 summaries are returned. There is no limit and no paging, so a mature knowledge base returns its whole FAQ set on every page load. Raise as a performance defect. | Not Run |
| TC-26-011 | Browsing does not increment view counts | Edge | P3 | A published FAQ with `viewCount` 0 | — | 1. `GET /api/kb/faqs` several times.<br>2. Read the article and check its `viewCount`. | Still 0. Only `GET /api/kb/articles/{id}` increments the counter, so appearing in a list is correctly not counted as a view. Record as verified. | Not Run |
| TC-26-012 | The endpoint is public | Security | P3 | API running | No credentials | 1. `GET /api/kb/faqs` with no `Authorization` header. | `200 OK`. For a customer-facing FAQ list this is the intended behaviour, and the `Published` filter is what protects unreleased content. Record as verified rather than as a gap — but re-confirm once auth lands that this route stays anonymous. | Not Run |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-26-001, TC-26-004 | |
| AC-2 Invalid input → 400 | TC-26-006 | |
| AC-3 Not found | TC-26-008 | An empty match returns `[]`, not `404` |
| AC-4 Authorization | TC-26-012 | Intentionally public |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-39 | The FAQ list applies no ordering, so the sequence is unstable across calls. |
| GAP-84 | The FAQ list has no result cap or paging. |
