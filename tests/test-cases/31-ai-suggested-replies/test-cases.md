# Test Cases — 31 AI suggested replies

| | |
|---|---|
| **Story** | [`stories/31-ai-suggested-replies`](../../../stories/31-ai-suggested-replies/story.md) |
| **Spec** | [`specs/31-ai-suggested-replies`](../../../specs/31-ai-suggested-replies/spec.md) |
| **Area** | AI Features |
| **Priority** | P3 |
| **Endpoints** | `POST /api/tickets/{id}/ai/suggest-reply` |
| **Implementation** | [`AiController.cs`](../../../backend/CrmApi/Controllers/AiController.cs), [`AiService.cs`](../../../backend/CrmApi/Services/AiService.cs) |
| **UI** | [`ticket-detail.page.ts`](../../../frontend/src/app/pages/ticket-detail.page.ts) — a "suggested reply" button |

## The suggestion depends only on the category

`SuggestReplyAsync` is a `switch` over `ticket.Category`. It never reads the messages, the
subject, the customer or the history. Five categories map to five fixed strings:

| Category | Reply opens with |
|---|---|
| `Billing` | `Thanks for reaching out about your billing concern.` |
| `Technical` | `Sorry for the trouble. Could you confirm the exact error message…` |
| `Account` | `I can help with your account. For security, could you confirm…` |
| `FeatureRequest` | `Thanks for the suggestion! I've logged this for our product team…` |
| `General` and any default | `Thanks for contacting support. I'm looking into this now…` |

So there are exactly five possible outputs across the entire product, and the same ticket
returns the same text forever. That is the central thing to verify, and to raise with product.

Note the endpoint is a `POST` that takes **no request body** and mutates nothing.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-31-001 | A billing ticket returns the billing reply | Positive | P3 | A `Billing` ticket | — | 1. `POST /api/tickets/{id}/ai/suggest-reply`. | `200 OK` with `ticketId` and a `suggestedText` beginning `Thanks for reaching out about your billing concern.` | Not Run |
| TC-31-002 | A technical ticket returns the technical reply | Positive | P3 | A `Technical` ticket | — | 1. `POST .../ai/suggest-reply`. | The reply asks the customer to confirm the exact error message and the steps that lead to it. | Not Run |
| TC-31-003 | An account ticket returns the account reply | Positive | P3 | An `Account` ticket | — | 1. `POST .../ai/suggest-reply`. | The reply asks the customer to confirm the email address on file for identity verification. | Not Run |
| TC-31-004 | A feature request returns the product-team reply | Positive | P3 | A `FeatureRequest` ticket | — | 1. `POST .../ai/suggest-reply`. | The reply thanks the customer and says the suggestion has been logged for the product team. | Not Run |
| TC-31-005 | A general ticket returns the fallback reply | Edge | P3 | A `General` ticket | — | 1. `POST .../ai/suggest-reply`. | The generic `Thanks for contacting support. I'm looking into this now…` — `General` hits the `switch` default rather than a case of its own. | Not Run |
| TC-31-006 | The suggestion ignores the ticket's messages entirely | Negative | P3 | Two `Billing` tickets: one with 10 detailed messages, one with none | — | 1. `POST .../ai/suggest-reply` on each.<br>2. Compare the two strings. | **Identical.** The suggestion is derived from the category alone, so it cannot reference anything the customer actually said. This is the core limitation of story 31 as built — evidence for GAP-92. | Not Run |
| TC-31-007 | The suggestion changes when the category changes | Positive | P3 | A `Billing` ticket | `{"category":"Technical"}` | 1. `POST .../ai/suggest-reply`.<br>2. `PATCH /api/tickets/{id}` to `Technical`.<br>3. `POST .../ai/suggest-reply` again. | The second call returns the technical reply. Re-categorising is the only way to change the suggestion. | Not Run |
| TC-31-008 | The suggestion is stable across repeated calls | Positive | P3 | Any ticket | — | 1. `POST .../ai/suggest-reply` three times.<br>2. Compare. | Byte-identical every time — the engine is deterministic, so exact-match assertions are safe here. | Not Run |
| TC-31-009 | The suggestion is never sent to the customer | Positive | P3 | A ticket with a known message count | — | 1. `POST .../ai/suggest-reply`.<br>2. `GET /api/tickets/{id}/messages`.<br>3. `GET /api/tickets/{id}/history`. | The message count is unchanged and no history event is written. The endpoint suggests only — nothing is dispatched, and in fact there is no outbound message route at all (GAP-18). Record as verified. | Not Run |
| TC-31-010 | The call mutates nothing | Edge | P3 | Any ticket | — | 1. Record the ticket row.<br>2. `POST .../ai/suggest-reply`.<br>3. Re-read the ticket and the audit log. | Nothing changes and nothing is audited, despite the `POST` verb. `GET` would be the honest method here — flag the inconsistency, especially against story 30's summary which is a `GET` for the same kind of read-only work. | Not Run |
| TC-31-011 | A suggestion for a non-existent ticket | Negative | P3 | API running | A random UUID | 1. `POST /api/tickets/{random-uuid}/ai/suggest-reply`. | `404 Not Found` — the controller checks existence before calling the service. | Not Run |
| TC-31-012 | A request body is ignored | Edge | P3 | Any ticket | `{"tone":"formal","language":"ar"}` | 1. `POST .../ai/suggest-reply` with a body. | `200 OK` and the standard reply for the category. The action takes no parameter, so the body is discarded — there is no way to ask for a different tone, length or language. | Not Run |
| TC-31-013 | The reply is English only | Negative | P3 | A `Billing` ticket whose messages are all in Arabic | — | 1. `POST .../ai/suggest-reply`. | The suggestion comes back in English. The strings are hard-coded, so an Arabic-speaking customer's ticket yields an English draft — a direct conflict with story 53. Evidence for GAP-93. | Not Run |
| TC-31-014 | The suggestion is not personalised | Edge | P3 | A ticket for a customer with a known name | — | 1. `POST .../ai/suggest-reply`. | The text contains no customer name, no ticket number and no placeholder for either. An agent must add every specific detail by hand. | Not Run |
| TC-31-015 | Unauthorized caller cannot request a suggestion | Security | P3 | Auth layer deployed | No credentials | 1. `POST .../ai/suggest-reply` with no `Authorization` header. | `401 Unauthorized`. Low data-exposure risk here, since the output does not include customer data. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-31-001…005 | All five outputs enumerated |
| AC-2 Invalid input → 400 | TC-31-012 | The endpoint accepts no input to invalidate |
| AC-3 Not found | TC-31-011 | |
| AC-4 Authorization → 401/403 | TC-31-015 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-91 | `AiService` has no model behind it; suggestions are five hard-coded strings. |
| GAP-92 | The suggestion is derived from the ticket category alone and never reads the conversation, so it cannot address what the customer actually wrote. |
| GAP-93 | Suggested replies are English-only hard-coded strings, conflicting with story 53's bilingual requirement. |
| GAP-94 | The endpoint is a `POST` that mutates nothing and accepts no body, inconsistent with the summary endpoint's `GET`. |
