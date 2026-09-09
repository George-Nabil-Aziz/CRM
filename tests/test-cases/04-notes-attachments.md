# Test Cases — 04 Add notes and attachments

| | |
|---|---|
| **Story** | [`stories/04-notes-attachments`](../../../stories/04-notes-attachments/story.md) |
| **Spec** | [`specs/04-notes-attachments`](../../../specs/04-notes-attachments/spec.md) |
| **Area** | Customer Management |
| **Priority** | P1 |
| **Endpoints** | `POST /api/customers/{id}/notes` |
| **Implementation** | [`CustomersController.cs`](../../../backend/CrmApi/Controllers/CustomersController.cs) |
| **UI** | [`customer-detail.page.ts`](../../../frontend/src/app/pages/customer-detail.page.ts) |

## Request and response shape

| Field | In request | In response | Rule |
|---|---|---|---|
| `text` | Yes | Yes | `[Required, MinLength(1)]` |
| `attachmentUrl` | Yes | Yes | Optional, **unvalidated free text** |
| `authorId` | **No** | Yes | Always `null` — see GAP-11 |

There is no file upload. An attachment is a URL string pointing somewhere else.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-04-001 | Add a note to a customer | Positive | P1 | An existing customer | `{"text":"Customer prefers to be called after 6pm."}` | 1. `POST /api/customers/{id}/notes`. | `201 Created`. Body carries a generated `id`, the matching `customerId`, the submitted `text`, `attachmentUrl: null`, and a UTC `createdAt`. | Not Run |
| TC-04-002 | Add a note carrying an attachment URL | Positive | P2 | An existing customer | `{"text":"Signed contract","attachmentUrl":"https://files.example.com/contract.pdf"}` | 1. `POST /api/customers/{id}/notes`. | `201 Created` with `attachmentUrl` stored exactly as submitted. | Not Run |
| TC-04-003 | Empty note text is rejected | Negative | P1 | An existing customer | `{"text":""}` | 1. `POST /api/customers/{id}/notes`. | `400 Bad Request` naming `Text`. No note is created. | Not Run |
| TC-04-004 | Omitted note text is rejected | Negative | P1 | An existing customer | `{"attachmentUrl":"https://x.test/f.pdf"}` | 1. `POST` with no `text`. | `400 Bad Request` naming `Text`. An attachment cannot be filed without a note body. | Not Run |
| TC-04-005 | A note is visible on the customer's history | Positive | P2 | TC-04-001 has passed | — | 1. `GET /api/customers/{id}/history`. | The note appears as a `type: "note"` entry whose `summary` is the note text. | Not Run |
| TC-04-006 | Add a note to a customer that does not exist | Negative | P2 | API running | A random UUID | 1. `POST /api/customers/{random-uuid}/notes`. | `404 Not Found`. | Not Run |
| TC-04-007 | The note author is never recorded | Negative | P2 | An existing customer | Any valid note payload | 1. `POST /api/customers/{id}/notes`.<br>2. Inspect `authorId` in the response. | `authorId` is `null`. Spec 04 marks it required, but `AddNoteRequest` exposes no such field so no code path can set it. **This case is expected to fail against the spec** — evidence for GAP-11. | Not Run |
| TC-04-008 | The attachment URL is not validated | Negative | P3 | An existing customer | `{"text":"note","attachmentUrl":"javascript:alert(1)"}` | 1. `POST /api/customers/{id}/notes`. | `201 Created` — `AttachmentUrl` carries no `[Url]` attribute, so any string is stored. This becomes a stored-script risk the moment the UI renders it as an anchor. Raise as a security defect. | Not Run |
| TC-04-009 | A very long note is stored without truncation | Edge | P3 | An existing customer | `text` of 10,000 characters | 1. `POST /api/customers/{id}/notes`.<br>2. Read the note back through the history endpoint. | Either the full text round-trips, or the request fails cleanly on a column length limit. A silent truncation that loses the tail is a defect — record which happens. | Not Run |
| TC-04-010 | Notes cannot be edited or deleted | Negative | P2 | An existing note | — | 1. Look for update or delete routes for notes. | There are none. A note typed in error, or one containing information that must be removed, is permanent. Evidence for GAP-45. | Not Run |
| TC-04-011 | There is no file upload path | Negative | P2 | An existing customer | A local PDF file | 1. Attempt to attach a file rather than a URL. | No multipart or upload endpoint exists anywhere in the API. Story 04 says "notes and attachments"; only an unvalidated URL reference is implemented. Evidence for GAP-10. | Not Run |
| TC-04-012 | Unauthorized caller cannot add a note | Security | P1 | Auth layer deployed | No credentials | 1. `POST /api/customers/{id}/notes` with no `Authorization` header. | `401 Unauthorized` and no note created. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-04-001, TC-04-002, TC-04-005 | |
| AC-2 Invalid input → 400 | TC-04-003, TC-04-004 | |
| AC-3 Not found | TC-04-006 | |
| AC-4 Authorization → 401/403 | TC-04-012 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-10 | Attachments are URL strings only. There is no upload endpoint and no stored file. |
| GAP-11 | `AddNoteRequest` exposes no `authorId`, so `Note.AuthorId` is always `null` despite spec 04 marking it required. |
| GAP-12 | `AttachmentUrl` is unvalidated free text where the spec types it as a URL. |
| GAP-45 | Notes cannot be edited or deleted once written. |
