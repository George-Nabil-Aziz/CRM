# Test Cases — 33 AI suggested solutions

| | |
|---|---|
| **Story** | [`stories/33-ai-suggested-solutions`](../../../stories/33-ai-suggested-solutions/story.md) |
| **Spec** | [`specs/33-ai-suggested-solutions`](../../../specs/33-ai-suggested-solutions/spec.md) |
| **Area** | AI Features |
| **Priority** | P3 |
| **Endpoints** | `GET /api/tickets/{id}/ai/suggest-solutions` |
| **Implementation** | [`AiController.cs`](../../../backend/CrmApi/Controllers/AiController.cs), [`AiService.cs`](../../../backend/CrmApi/Services/AiService.cs) |

## What "suggested solutions" actually returns

```
tickets where Id != this && Category == this.Category
              && Status in (Resolved, Closed)
order by ResolvedAt descending
take 3
```

So it returns **up to three recently closed tickets in the same category** — their id, ticket
number and subject. It does not return the resolution text, the messages, or anything an agent
could act on directly; the agent must open each suggestion to see how it was handled. It also
never consults the knowledge base, even though one exists.

Similarity is category equality alone. Two tickets in `Technical` are "similar" whether one is a
login failure and the other a printing bug.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-33-001 | Related resolved tickets are suggested | Positive | P3 | An `Open` `Technical` ticket, plus 3 `Resolved` `Technical` tickets | — | 1. `GET /api/tickets/{id}/ai/suggest-solutions`. | `200 OK` with 3 entries, each carrying `ticketId`, `ticketNumber` and `subject`. | Not Run |
| TC-33-002 | At most three are returned | Edge | P3 | An `Open` `Billing` ticket, plus 10 `Resolved` `Billing` tickets | — | 1. `GET .../ai/suggest-solutions`.<br>2. Count the results. | Exactly 3 — the query takes the top 3. | Not Run |
| TC-33-003 | The most recently resolved come first | Positive | P3 | 5 `Resolved` tickets in one category with distinct `ResolvedAt` values | — | 1. `GET .../ai/suggest-solutions`.<br>2. Compare against the resolution times. | The 3 with the latest `ResolvedAt` are returned, newest first. | Not Run |
| TC-33-004 | Closed tickets are included alongside resolved ones | Positive | P3 | One `Resolved` and one `Closed` ticket in the category | — | 1. `GET .../ai/suggest-solutions`. | Both appear — the filter admits either status. | Not Run |
| TC-33-005 | Open and pending tickets are excluded | Positive | P3 | An `Open` ticket plus several `Open` and `Pending` tickets in the same category | — | 1. `GET .../ai/suggest-solutions`. | `[]` — unresolved tickets are not suggestions, since there is nothing to learn from them yet. | Not Run |
| TC-33-006 | Other categories are excluded | Positive | P3 | An `Open` `Billing` ticket, plus resolved tickets only in `Technical` | — | 1. `GET .../ai/suggest-solutions`. | `[]`. Matching is on exact category equality. | Not Run |
| TC-33-007 | The ticket never suggests itself | Edge | P3 | A `Resolved` `Technical` ticket, plus other resolved tickets in that category | The resolved ticket's own id | 1. `GET .../ai/suggest-solutions` on the resolved ticket. | Its own id is absent from the results — the query excludes `Id != ticketId`. | Not Run |
| TC-33-008 | A ticket with no comparable history returns an empty list | Edge | P3 | The only ticket in its category | — | 1. `GET .../ai/suggest-solutions`. | `200 OK` with `[]`, not `404` and not an error. This is the expected state for a new deployment. | Not Run |
| TC-33-009 | Resolved tickets with a null resolution time still appear | Edge | P3 | A `Closed` ticket in the category whose `ResolvedAt` is null — closed without ever passing through `Resolved` | — | 1. `GET .../ai/suggest-solutions`. | Confirm whether it appears and where it sorts. `OrderByDescending` on a null places it last in SQL Server, so such tickets are effectively deprioritised. Record the actual behaviour. | Not Run |
| TC-33-010 | Suggestions change when the category changes | Positive | P3 | An `Open` `Billing` ticket; resolved tickets exist in both `Billing` and `Technical` | `{"category":"Technical"}` | 1. `GET .../ai/suggest-solutions`.<br>2. `PATCH /api/tickets/{id}` to `Technical`.<br>3. `GET` again. | The second call returns the `Technical` set. Suggestions are computed live, never cached. | Not Run |
| TC-33-011 | Suggestions for a non-existent ticket | Negative | P3 | API running | A random UUID | 1. `GET /api/tickets/{random-uuid}/ai/suggest-solutions`. | `404 Not Found` — the controller checks existence before calling the service. | Not Run |
| TC-33-012 | Suggestions ignore the ticket's actual content | Negative | P3 | An `Open` `Technical` ticket about a printing fault, plus resolved `Technical` tickets about unrelated issues | — | 1. `GET .../ai/suggest-solutions`.<br>2. Read the returned subjects. | Unrelated tickets are returned. Similarity is category equality alone — the subject, the messages and any keywords are never compared. Two tickets sharing a category are treated as equivalent. Evidence for GAP-100. | Not Run |
| TC-33-013 | The knowledge base is never consulted | Negative | P3 | A published knowledge-base article directly answering the ticket, and no resolved tickets in the category | — | 1. `GET .../ai/suggest-solutions`. | `[]`. The service queries only the tickets table. Story 33 is about suggesting solutions, and the product's actual solution repository is ignored. Raise as a defect — GAP-101. | Not Run |
| TC-33-014 | The suggestion carries no resolution detail | Negative | P3 | TC-33-001 has passed | — | 1. Inspect a returned entry. | It holds only `ticketId`, `ticketNumber` and `subject`. There is no resolution text, no message excerpt and no summary, so an agent must open each suggested ticket and read it. Spec 33 lists `suggestionText` as a required field — **expected to fail** — GAP-102. | Not Run |
| TC-33-015 | Suggestions are unbounded by age | Edge | P3 | Resolved tickets in the category from three years ago and none since | — | 1. `GET .../ai/suggest-solutions`. | The old tickets are returned. There is no recency window, so stale resolutions surface as current advice. Minor, but worth a product decision. | Not Run |
| TC-33-016 | Suggestions are deterministic | Positive | P3 | A stable dataset | — | 1. `GET .../ai/suggest-solutions` three times.<br>2. Compare. | Identical each time, so exact assertions are safe — with the caveat in TC-33-009 about ties on `ResolvedAt`. | Not Run |
| TC-33-017 | The endpoint leaks other customers' ticket subjects | Security | P3 | Resolved tickets belonging to several different customers in one category | — | 1. `GET .../ai/suggest-solutions`. | Subjects from **other customers'** tickets are returned. That is inherent to the feature, but it means the endpoint must never be exposed to the customer portal — a subject can carry personal or commercial detail. Flag as a data-boundary risk to confirm before release. | Not Run |
| TC-33-018 | Unauthorized caller cannot request suggestions | Security | P3 | Auth layer deployed | No credentials | 1. `GET .../ai/suggest-solutions` with no `Authorization` header. | `401 Unauthorized`. Given TC-33-017, this endpoint is more sensitive than the other AI routes. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-33-001…004 | |
| AC-2 Invalid input → 400 | — | No request body or query parameters exist to invalidate |
| AC-3 Not found | TC-33-011 | An empty result set returns `[]`, not `404` |
| AC-4 Authorization → 401/403 | TC-33-018 | Blocked, GAP-01 |
| Data field `suggestionText` | TC-33-014 | Absent — GAP-102 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-100 | Similarity is category equality alone. Ticket content is never compared, so suggestions are frequently irrelevant. |
| GAP-101 | The knowledge base is never consulted, even though it is the product's designated solution repository. |
| GAP-102 | Suggestions carry no `suggestionText` or resolution detail — only a ticket number and subject. |
| GAP-103 | Suggestions have no recency window, so resolutions of any age surface as current advice. |
| GAP-104 | The endpoint returns other customers' ticket subjects, so it must never be exposed through the customer portal. |
