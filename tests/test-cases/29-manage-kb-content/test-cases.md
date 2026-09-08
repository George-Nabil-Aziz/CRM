# Test Cases — 29 Manage knowledge base content

| | |
|---|---|
| **Story** | [`stories/29-manage-kb-content`](../../../stories/29-manage-kb-content/story.md) |
| **Spec** | [`specs/29-manage-kb-content`](../../../specs/29-manage-kb-content/spec.md) |
| **Area** | Knowledge Base |
| **Priority** | P3 |
| **Endpoints** | `POST /api/kb/articles`, `POST /api/kb/articles/{id}/publish` |
| **Implementation** | [`ArticlesController.cs`](../../../backend/CrmApi/Controllers/ArticlesController.cs), [`AuditLogger.cs`](../../../backend/CrmApi/Services/AuditLogger.cs) |

## "Manage" means create and publish, and nothing else

| Capability | Route | Present |
|---|---|---|
| Create a draft | `POST /api/kb/articles` | Yes |
| Publish it | `POST /api/kb/articles/{id}/publish` | Yes |
| Preview a draft | — | **No** (GAP-34) |
| Edit an article | — | **No** |
| Unpublish it | — | **No** |
| Delete it | — | **No** |

A published article is therefore permanent and uncorrectable. Both write routes call
`AuditLogger`, making this one of the few areas of the product that is audited at all.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-29-001 | Create an article as a draft | Positive | P3 | API running | `{"title":"Resetting your password","body":"Open Settings, then...","category":"Account","type":"Guide"}` | 1. `POST /api/kb/articles`. | `201 Created` with a generated `id`, the submitted values, `published: false` and `viewCount: 0`. Nothing is created published. | Not Run |
| TC-29-002 | A new draft is invisible everywhere | Positive | P3 | TC-29-001 has passed | The draft's id | 1. `GET /api/kb/articles/{id}`.<br>2. `GET /api/kb/faqs`.<br>3. `GET /api/kb/search?q=password`.<br>4. `GET /api/portal/kb`. | `404` from the first; absent from all three lists. A draft is fully hidden until published. | Not Run |
| TC-29-003 | Publish a draft and it becomes visible | Positive | P3 | TC-29-001 has passed | The draft's id | 1. `POST /api/kb/articles/{id}/publish`.<br>2. `GET /api/kb/articles/{id}`. | The publish call returns `200 OK` with `published: true`, and the read then succeeds where it previously returned `404`. | Not Run |
| TC-29-004 | Publishing sets the publication timestamp | Positive | P3 | A draft article | — | 1. Note the current time.<br>2. `POST .../publish`.<br>3. Inspect the stored `PublishedAt`. | `PublishedAt` holds a UTC time within a few seconds of the request. | Not Run |
| TC-29-005 | A published FAQ appears in the FAQ list | Positive | P3 | A draft of type `Faq` | — | 1. Publish it.<br>2. `GET /api/kb/faqs`. | The article now appears in the list. | Not Run |
| TC-29-006 | An empty title is rejected | Negative | P3 | API running | `{"title":"","body":"x","category":"Account","type":"Guide"}` | 1. `POST /api/kb/articles`. | `400 Bad Request` naming `Title`. | Not Run |
| TC-29-007 | An empty body is rejected | Negative | P3 | API running | `{"title":"x","body":"","category":"Account","type":"Guide"}` | 1. `POST`. | `400 Bad Request` naming `Body`. | Not Run |
| TC-29-008 | A missing category or type is rejected | Negative | P3 | API running | Omit `category`; then omit `type` | 1. `POST` once per case. | `400 Bad Request` each time — both are non-nullable enums marked `[Required]`. | Not Run |
| TC-29-009 | An invalid category or type is rejected | Negative | P3 | API running | `"type":"Whitepaper"`, then `"category":"FeatureRequest"` | 1. `POST` once per value. | `400 Bad Request` each time. Note `FeatureRequest` is a valid `TicketCategory` but **not** a valid `ArticleCategory` — an easy mistake for a client to make. | Not Run |
| TC-29-010 | Publishing an article that does not exist | Negative | P3 | API running | A random UUID | 1. `POST /api/kb/articles/{random-uuid}/publish`. | `404 Not Found`. | Not Run |
| TC-29-011 | Re-publishing overwrites the publication date | Edge | P3 | A published article with a known `PublishedAt` | — | 1. Note `PublishedAt`.<br>2. `POST .../publish` a second time.<br>3. Compare. | `200 OK`, but `PublishedAt` is **overwritten** with the new time. There is no already-published guard, so the original publication date is silently lost and any reporting on it is distorted. Raise as a defect — GAP-37. | Not Run |
| TC-29-012 | Creating an article is audited | Positive | P3 | API running | A valid create payload | 1. `POST /api/kb/articles`.<br>2. `GET /api/audit-logs`. | An entry exists with action `create`, target type `article` and the new article's id. | Not Run |
| TC-29-013 | Publishing an article is audited | Positive | P3 | A draft article | — | 1. `POST .../publish`.<br>2. `GET /api/audit-logs`. | An entry exists with action `update` and target type `article`. Together with TC-29-012 the article's lifecycle is traceable — one of the few places in the product where that is true. | Not Run |
| TC-29-014 | The audit entry does not identify the author | Negative | P3 | TC-29-012 has passed | — | 1. Inspect the audit entry's `actorId`. | It is null or empty — there is no authenticated identity to record. The audit trail says *what* happened but not *who* did it. Follows from GAP-01. | Not Run |
| TC-29-015 | The `Location` header points at a 404 | Edge | P3 | API running | A valid create payload | 1. `POST /api/kb/articles`.<br>2. Follow the `Location` header. | The header points at `GET /api/kb/articles/{id}`, which returns `404` because the article is not yet published. The created resource is unreachable at the URL its own response advertises — a REST contract violation. Raise as a defect — GAP-38. | Not Run |
| TC-29-016 | Articles cannot be edited | Negative | P3 | A published article containing a typo | — | 1. Look for a `PATCH` or `PUT` route for articles. | There is none. A published article with an error in it can never be corrected — the only remedy is to publish a second article and leave the wrong one live. Evidence for GAP-35. | Not Run |
| TC-29-017 | Articles cannot be unpublished or deleted | Negative | P3 | A published article containing incorrect information | — | 1. Look for an unpublish or delete route. | There is none. Wrong, outdated or sensitive content cannot be withdrawn once published, which is a content-governance risk as well as a functional gap. Evidence for GAP-35. | Not Run |
| TC-29-018 | The author is never recorded | Negative | P3 | API running | A valid create payload | 1. `POST /api/kb/articles`.<br>2. Inspect the response and the stored row. | There is no author field on the request, the response or the model, although spec 29 marks `authorId` required. **This case is expected to fail against the spec** — evidence for GAP-36. | Not Run |
| TC-29-019 | Duplicate titles are permitted | Edge | P3 | An article titled `Resetting your password` exists | The identical payload | 1. `POST` again and publish both. | Both exist and both appear in search results, indistinguishable to a reader. There is no uniqueness constraint. Combined with GAP-35 this is how a correction has to be made, so the knowledge base accumulates conflicting duplicates. | Not Run |
| TC-29-020 | Article content is stored verbatim | Edge | P3 | API running | A body containing `<script>alert(1)</script>` | 1. `POST`, publish, then `GET /api/kb/articles/{id}`. | The script tag round-trips unescaped. Since this write route is unauthenticated (TC-29-021), anyone can publish content that the agent and portal UIs will render. Output encoding in the UI is mandatory — raise the combined risk explicitly. | Not Run |
| TC-29-021 | Anyone can create and publish content | Security | P3 | API running | A valid create payload | 1. `POST /api/kb/articles` with no credentials.<br>2. `POST .../publish` with no credentials. | Both currently succeed. An unauthenticated caller can publish arbitrary content to the customer-facing knowledge base, and — because of GAP-35 — nobody can take it down again. This pairing makes it the most serious issue in this area. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-29-001, TC-29-003, TC-29-004 | |
| AC-2 Invalid input → 400 | TC-29-006…009 | |
| AC-3 Not found / conflict | TC-29-010, TC-29-011 | Re-publishing returns `200`, not `409` |
| AC-4 Authorization → 401/403 | TC-29-021 | Blocked, GAP-01 |
| Data field `authorId` | TC-29-018 | Expected to fail — GAP-36 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-34 | Drafts cannot be previewed before publication. |
| GAP-35 | Articles cannot be edited, unpublished or deleted. Published content is permanent. |
| GAP-36 | `authorId` is absent from the request, response and model, although the spec marks it required. |
| GAP-37 | Re-publishing overwrites `PublishedAt`, losing the original publication date. |
| GAP-38 | The create response returns a `Location` header that resolves to `404`. |
| GAP-89 | Unauthenticated publishing combined with the inability to unpublish means arbitrary content can be put in front of customers permanently. |
