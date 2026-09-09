# Test Cases — 30 AI ticket summaries

| | |
|---|---|
| **Story** | [`stories/30-ai-ticket-summaries`](../../../stories/30-ai-ticket-summaries/story.md) |
| **Spec** | [`specs/30-ai-ticket-summaries`](../../../specs/30-ai-ticket-summaries/spec.md) |
| **Area** | AI Features |
| **Priority** | P3 |
| **Endpoints** | `GET /api/tickets/{id}/ai/summary` |
| **Implementation** | [`AiController.cs`](../../../backend/CrmApi/Controllers/AiController.cs), [`AiService.cs`](../../../backend/CrmApi/Services/AiService.cs) |
| **UI** | [`ticket-detail.page.ts`](../../../frontend/src/app/pages/ticket-detail.page.ts) — a "summary" button |

## There is no model — the output is a template

`AiService` is a deterministic, keyword-and-template engine with no external LLM call and no
credentials. Its own comment says the method bodies can be swapped for real model calls later.
That makes this feature **fully and exactly testable**, which would not be true of a real model,
so the cases below assert on precise strings.

`SummarizeAsync` picks one of three templates by message count:

| Messages | Output |
|---|---|
| 0 | `Ticket {number} ({category}, {priority}): {subject}. No messages yet.` |
| 1 | `Ticket {number} ({category}, {priority}): {first}` |
| 2 or more | `Ticket {number} ({category}, {priority}, {count} messages). Opened with: {first} Most recent: {last}` |

Message bodies are truncated to 160 characters with a trailing `...`.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-30-001 | Summarise a ticket with several messages | Positive | P3 | A `Technical`/`High` ticket with 3 messages sent at distinct times | — | 1. `GET /api/tickets/{id}/ai/summary`. | `200 OK` with `ticketId` and a `summaryText` matching the multi-message template: the ticket number, `(Technical, High, 3 messages)`, then `Opened with:` the earliest body and `Most recent:` the latest. | Not Run |
| TC-30-002 | The summary uses the first and last message by time | Positive | P3 | A ticket with 3 messages whose insertion order differs from their `sentAt` order | — | 1. `GET .../ai/summary`. | The summary quotes the earliest and latest by `sentAt`, not by insertion order — the service orders by `SentAt` before selecting. | Not Run |
| TC-30-003 | A single-message ticket omits the "most recent" clause | Edge | P3 | A ticket with exactly 1 message | — | 1. `GET .../ai/summary`. | The summary reads `Ticket {number} ({category}, {priority}): {body}` with no message count and no `Most recent:` clause. | Not Run |
| TC-30-004 | A ticket with no messages says so | Edge | P3 | An agent-created ticket with no inbound messages | — | 1. `GET .../ai/summary`. | The summary ends with `No messages yet.` and quotes the ticket **subject** instead of a message body. This is the common case for phone-raised tickets. | Not Run |
| TC-30-005 | A long message body is truncated at 160 characters | Edge | P3 | A ticket whose only message body is 400 characters | — | 1. `GET .../ai/summary`.<br>2. Measure the quoted portion. | Exactly the first 160 characters followed by `...`. | Not Run |
| TC-30-006 | A 160-character body is not truncated | Edge | P3 | A ticket whose only message body is exactly 160 characters | — | 1. `GET .../ai/summary`. | The full body appears with **no** trailing `...` — the check is `length <= max`. Boundary confirmed. | Not Run |
| TC-30-007 | The summary reflects the ticket's current category and priority | Positive | P3 | A ticket with messages | `{"category":"Billing","priority":"Urgent"}` | 1. `GET .../ai/summary`.<br>2. `PATCH /api/tickets/{id}` to change both.<br>3. `GET .../ai/summary` again. | The second summary shows `(Billing, Urgent)`. Summaries are generated on demand, never cached, so they always reflect current state. | Not Run |
| TC-30-008 | The summary is stable across repeated calls | Positive | P3 | A ticket with messages | — | 1. `GET .../ai/summary` three times.<br>2. Compare the strings. | Byte-identical every time. The engine is deterministic, so this endpoint is safe to assert on exactly — unlike a real model, which would need fuzzy assertions. | Not Run |
| TC-30-009 | A summary of a non-existent ticket | Negative | P3 | API running | A random UUID | 1. `GET /api/tickets/{random-uuid}/ai/summary`. | `404 Not Found` — the controller checks existence before calling the service. | Not Run |
| TC-30-010 | The service's own not-found path is unreachable | Edge | P3 | API running | — | 1. Review `AiService.SummarizeAsync`. | It throws `KeyNotFoundException` when the ticket is missing, but the controller's existence check runs first, so that throw can never surface through HTTP. If the check were ever removed the exception would become an unhandled `500`. Record as a latent defect. | Not Run |
| TC-30-011 | Messages from every channel are included | Positive | P3 | A ticket carrying email, SMS and chat messages | — | 1. `GET .../ai/summary`. | The count covers all three and the quoted bodies may come from any channel — the summary reads the whole `Messages` table for the ticket, with no channel filter. | Not Run |
| TC-30-012 | Internal notes are not summarised | Edge | P3 | A ticket with 1 message and 2 internal notes | — | 1. `GET .../ai/summary`. | The count is 1. Internal notes live in a separate table and never reach the summary, so agent-only context is correctly excluded from a customer-oriented summary. Record as verified. | Not Run |
| TC-30-013 | Arabic message bodies survive summarisation | Edge | P3 | A ticket whose messages are in Arabic | — | 1. `GET .../ai/summary`. | The Arabic text appears unchanged with no mojibake. Note that truncation counts UTF-16 characters, so a 160-character cut may fall mid-word — acceptable, but confirm it does not split a surrogate pair and produce invalid output. | Not Run |
| TC-30-014 | The summary is not persisted | Edge | P3 | A ticket with messages | — | 1. `GET .../ai/summary`.<br>2. Inspect the ticket row and the audit log. | Nothing is stored — no summary column, no audit entry. Spec 30 lists `generatedAt` as a data field, but nothing is generated once and kept; the value is recomputed on every call. Evidence for GAP-90. | Not Run |
| TC-30-015 | Unauthorized caller cannot read a summary | Security | P3 | Auth layer deployed | No credentials | 1. `GET .../ai/summary` with no `Authorization` header. | `401 Unauthorized`. Until then, anyone holding a ticket id gets a condensed view of the customer's conversation in a single call. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-30-001, TC-30-003, TC-30-004 | |
| AC-2 Invalid input → 400 | — | No request body or query parameters exist to invalidate |
| AC-3 Not found | TC-30-009 | |
| AC-4 Authorization → 401/403 | TC-30-015 | Blocked, GAP-01 |
| Data field `generatedAt` | TC-30-014 | Absent — GAP-90 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-90 | `AiSummaryResponse` carries no `generatedAt`, and summaries are neither stored nor audited, although spec 30 lists the field. |
| GAP-91 | `AiService` is a keyword-and-template engine with no model behind it. That is a reasonable placeholder, but story 30's "AI summary" is presently a formatted string — confirm the product expectation before release. |
