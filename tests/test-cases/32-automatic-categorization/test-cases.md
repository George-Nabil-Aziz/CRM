# Test Cases — 32 Automatic categorization

| | |
|---|---|
| **Story** | [`stories/32-automatic-categorization`](../../../stories/32-automatic-categorization/story.md) |
| **Spec** | [`specs/32-automatic-categorization`](../../../specs/32-automatic-categorization/spec.md) |
| **Area** | AI Features |
| **Priority** | P3 |
| **Contract** | `EVENT ticket.created AI classification step` — **no HTTP endpoint** (GAP-07) |
| **Implementation** | [`AiService.cs`](../../../backend/CrmApi/Services/AiService.cs) — `Categorize`, called from [`ChannelIngestionService.cs`](../../../backend/CrmApi/Services/ChannelIngestionService.cs) |

## The classifier

`Categorize(subject, body)` lower-cases `"{subject} {body}"` and returns the first category
whose keyword list has a substring hit. If nothing hits, it returns `General`.

| Category | Keywords |
|---|---|
| `Billing` | `invoice`, `charge`, `refund`, `payment`, `bill` |
| `Technical` | `error`, `bug`, `crash`, `not working`, `login`, `broken` |
| `Account` | `password`, `account`, `profile`, `email address`, `access` |
| `FeatureRequest` | `feature`, `suggestion`, `please add`, `would be nice` |
| `General` | — the fallback |

Two things matter for testing:

- **It runs only on channel ingestion.** A ticket created through `POST /api/tickets` or
  `POST /api/portal/tickets` takes the caller's category and is never classified.
- **Matching is substring, not word-boundary**, so `bill` matches *billing*, *billion* and
  *Bill* the name.

Spec 32 also lists a `categoryConfidence` field. Nothing produces one.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-32-001 | A billing keyword yields `Billing` | Positive | P3 | An unknown sender | Inbound email with body `I was charged twice this month` | 1. `POST /api/channels/email/inbound`.<br>2. Read the created ticket's `category`. | `Billing` — matched on `charge`. | Not Run |
| TC-32-002 | A technical keyword yields `Technical` | Positive | P3 | An unknown sender | Body `The app crashes when I open reports` | 1. `POST` inbound.<br>2. Read the category. | `Technical` — matched on `crash`. | Not Run |
| TC-32-003 | An account keyword yields `Account` | Positive | P3 | An unknown sender | Body `I forgot my password` | 1. `POST` inbound.<br>2. Read the category. | `Account` — matched on `password`. | Not Run |
| TC-32-004 | A feature keyword yields `FeatureRequest` | Positive | P3 | An unknown sender | Body `It would be nice to export to Excel` | 1. `POST` inbound.<br>2. Read the category. | `FeatureRequest` — matched on `would be nice`. | Not Run |
| TC-32-005 | No recognised keyword falls back to `General` | Edge | P3 | An unknown sender | Body `Hello, is anyone there?` | 1. `POST` inbound.<br>2. Read the category. | `General`. | Not Run |
| TC-32-006 | Matching is case-insensitive | Edge | P3 | An unknown sender | Body `MY INVOICE IS WRONG` | 1. `POST` inbound.<br>2. Read the category. | `Billing` — the input is lower-cased before matching. | Not Run |
| TC-32-007 | The subject is matched as well as the body | Positive | P3 | An unknown sender | Inbound email with subject `Refund request` and body `Please see attached` | 1. `POST` inbound.<br>2. Read the category. | `Billing` — the classifier concatenates subject and body. Note this only applies to email and the web form; SMS, WhatsApp and chat pass no subject. | Not Run |
| TC-32-008 | A multi-word keyword must appear contiguously | Edge | P3 | An unknown sender | Body `it is not currently working` | 1. `POST` inbound.<br>2. Read the category. | `General`, **not** `Technical` — the keyword is the literal phrase `not working`, and the inserted word breaks it. | Not Run |
| TC-32-009 | Substring matching produces false positives | Negative | P3 | An unknown sender | Body `Please pass this to Bill in accounts` | 1. `POST` inbound.<br>2. Read the category. | `Billing` — `bill` matches inside the name *Bill*. Note `account` would also have matched. There is no word-boundary check, so ordinary prose is frequently misclassified. Raise as a defect — GAP-95. | Not Run |
| TC-32-010 | A message matching two categories resolves by dictionary order, not relevance | Edge | P3 | An unknown sender | Body `I cannot login to fix my invoice` | 1. `POST` inbound several times with fresh senders.<br>2. Read the category each time. | The winner is whichever category the `foreach` reaches first — `CategoryKeywords` is declared `Billing`, `Technical`, `Account`, `FeatureRequest`, so `Billing` wins here regardless of which term is more central to the message. Confirm the result is at least **stable** across runs; if it varies, the dictionary is not order-preserving and that is a defect in itself. | Not Run |
| TC-32-011 | Classification is deterministic | Positive | P3 | Two unknown senders | The identical body | 1. `POST` inbound twice with different senders.<br>2. Compare the two categories. | Identical. The engine has no randomness, so category assertions can be exact. | Not Run |
| TC-32-012 | An agent-created ticket is never classified | Negative | P3 | An existing customer | `POST /api/tickets` with `"category":"General"` and subject `Refund for wrong invoice` | 1. Create the ticket through the agent route.<br>2. Read its category. | `General` — the caller's value stands. The classifier runs only inside `ChannelIngestionService`, so tickets raised by an agent or through the portal bypass it entirely. Evidence for GAP-96. | Not Run |
| TC-32-013 | A portal-submitted ticket is never classified | Negative | P3 | A portal customer | `POST /api/portal/tickets` with a billing-flavoured description | 1. Submit through the portal.<br>2. Read the category. | The submitted category stands, unclassified. Same root cause as TC-32-012. | Not Run |
| TC-32-014 | Classification applies only when a ticket is created | Edge | P3 | A customer with an `Open` `General` ticket | An inbound email full of billing keywords | 1. `POST` inbound.<br>2. Re-read the ticket's category. | Still `General`. The message is appended to the existing ticket and the classifier never runs, so a conversation that changes subject keeps its original category. Raise as a defect. | Not Run |
| TC-32-015 | No confidence score is produced | Negative | P3 | An unknown sender | Any inbound message | 1. `POST` inbound.<br>2. Inspect the ticket response and the stored row for a confidence field. | There is none. Spec 32 lists `categoryConfidence` as a data field, but the classifier returns a bare enum with no score, so a low-confidence guess is indistinguishable from a certain one and cannot be routed for human review. **Expected to fail against the spec** — GAP-97. | Not Run |
| TC-32-016 | Misclassification is correctable but unaudited | Edge | P3 | A ticket auto-classified as `Billing` in error | `{"category":"Technical"}` | 1. `PATCH /api/tickets/{id}`.<br>2. `GET /api/tickets/{id}/history`. | The category is corrected, but no history event records that a human overrode the classifier — so there is no feedback signal and no way to measure the classifier's accuracy over time. Follows from GAP-15. | Not Run |
| TC-32-017 | Arabic content is never classified | Negative | P3 | An unknown sender | An inbound message whose body is Arabic and clearly about an invoice | 1. `POST` inbound.<br>2. Read the category. | `General`. Every keyword is English, so no Arabic message can ever match a category. In a bilingual product (story 53) this means classification silently does nothing for half the user base. Raise as a defect — GAP-98. | Not Run |
| TC-32-018 | An empty or whitespace body is handled safely | Edge | P3 | An unknown sender | The shortest body validation permits — a single character | 1. `POST` inbound. | `General`, with no exception. `Categorize` performs no null or length checks, but validation guarantees a non-empty body before it is reached. | Not Run |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-32-001…004, TC-32-007 | Verified through channel ingestion — the story has no endpoint (GAP-07) |
| AC-2 Invalid input → 400 | TC-32-018 | The classifier takes no external input of its own |
| AC-3 Not found / conflict | TC-32-010 | Multi-category matches resolve by declaration order |
| AC-4 Authorization → 401/403 | — | Not applicable; the classifier runs in-process |
| Data field `categoryConfidence` | TC-32-015 | Absent — GAP-97 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-07 | Story 32 has no HTTP surface and is verified through channel ingestion. |
| GAP-95 | Keyword matching is substring-based with no word boundaries, so `bill` matches *Bill* and *billion*. |
| GAP-96 | Classification runs only on channel ingestion. Agent-created and portal-submitted tickets are never classified. |
| GAP-97 | No `categoryConfidence` is produced, so low-confidence guesses cannot be routed for review. |
| GAP-98 | Every keyword is English, so Arabic messages always fall back to `General`. |
| GAP-99 | A ticket's category is never re-evaluated as a conversation develops. |
