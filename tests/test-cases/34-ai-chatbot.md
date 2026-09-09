# Test Cases — 34 AI chatbot

| | |
|---|---|
| **Story** | [`stories/34-ai-chatbot`](../../../stories/34-ai-chatbot/story.md) |
| **Spec** | [`specs/34-ai-chatbot`](../../../specs/34-ai-chatbot/spec.md) |
| **Area** | AI Features |
| **Priority** | P3 |
| **Endpoints** | `POST /api/chatbot/message` |
| **Implementation** | [`AiController.cs`](../../../backend/CrmApi/Controllers/AiController.cs), [`AiService.cs`](../../../backend/CrmApi/Services/AiService.cs) — `ChatbotReplyAsync` |
| **UI** | [`knowledge-base.page.ts`](../../../frontend/src/app/pages/knowledge-base.page.ts) — an "Ask a question…" box |

## How a reply is produced

1. Lower-case the message and split it on spaces.
2. Load **every published article** into memory.
3. Find the first article whose title or body contains any word **longer than 3 characters**.
4. Hit → return the first 300 characters of that article's body, `handedOff: false`.
5. Miss → return the fixed apology string, `handedOff: true`.

## The session is a lie

`ChatbotMessageResponse` carries a `sessionId`, but nothing is persisted. If the caller supplies
one it is echoed back; if not, a fresh GUID is minted. `ChatbotReplyAsync` receives only the
current message string. There is no conversation, no history and no `ChatSession` table — spec
34's `customerId`, `messages` and `handedOff` data fields have no storage behind them.

`handedOff: true` is also just a flag in the response. No ticket is created, no agent is
notified, and nothing is queued.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-34-001 | A question matching an article returns its content | Positive | P3 | A published article titled `Resetting your password` | `{"message":"How do I reset my password?"}` | 1. `POST /api/chatbot/message`. | `200 OK` with `handedOff: false` and a `reply` containing the opening of that article's body. | Not Run |
| TC-34-002 | A long article body is truncated to 300 characters | Edge | P3 | A published article with a 1,000-character body | A message matching it | 1. `POST`.<br>2. Measure the reply. | Exactly the first 300 characters followed by `...`. | Not Run |
| TC-34-003 | A short article body is returned whole | Edge | P3 | A published article with a 100-character body | A message matching it | 1. `POST`. | The full body with **no** trailing `...` — the check is `length <= max`. | Not Run |
| TC-34-004 | An unmatched question hands off | Positive | P3 | `SEED-KB` | `{"message":"What is the airspeed of a swallow?"}` | 1. `POST`. | `handedOff: true` and the fixed reply `I couldn't find a confident answer to that in our knowledge base. I'll connect you with a human agent.` | Not Run |
| TC-34-005 | A new session id is generated when none is supplied | Positive | P3 | API running | `{"message":"hello there"}` | 1. `POST` twice with no `sessionId`.<br>2. Compare the two returned ids. | Both are valid UUIDs and they **differ** — a fresh id is minted per call. | Not Run |
| TC-34-006 | A supplied session id is echoed back | Edge | P3 | API running | `{"message":"hello there","sessionId":"<known-uuid>"}` | 1. `POST`. | The same id comes back. It is not validated, not looked up and not stored — any UUID is accepted, including one never issued. | Not Run |
| TC-34-007 | The session carries no context | Negative | P3 | A published article about passwords | Turn 1: `{"message":"I have a password problem"}`; turn 2: `{"message":"yes please","sessionId":"<from turn 1>"}` | 1. `POST` turn 1.<br>2. `POST` turn 2 with the same session id.<br>3. Read the second reply. | Turn 2 is answered as if turn 1 never happened — `yes please` has no word over 3 characters that matches an article, so it hands off. The session id buys nothing. **Expected to fail against story 34's conversational intent** — evidence for GAP-105. | Not Run |
| TC-34-008 | An empty message is rejected | Negative | P3 | API running | `{"message":""}` | 1. `POST`. | `400 Bad Request` naming `Message` — `[Required, MinLength(1)]`. | Not Run |
| TC-34-009 | A missing message is rejected | Negative | P3 | API running | `{}` | 1. `POST`. | `400 Bad Request` naming `Message`. | Not Run |
| TC-34-010 | Only words longer than three characters are matched | Edge | P3 | A published article whose body contains `the` and `and` but no other common words | `{"message":"the and for"}` | 1. `POST`. | `handedOff: true`. Words of three characters or fewer are skipped, which is what stops every question matching on filler words. Boundary: a 4-character word **is** used. | Not Run |
| TC-34-011 | A single common word matches almost anything | Negative | P3 | Several published articles | `{"message":"about"}` | 1. `POST`.<br>2. Read the reply. | Very likely a hit on the first article containing `about` anywhere in its body, returning content unrelated to any real question. One loose word is enough — there is no relevance threshold and no multi-word scoring. Raise as a defect — GAP-106. | Not Run |
| TC-34-012 | The first matching article wins, not the best | Negative | P3 | Two published articles, one squarely about passwords and one mentioning the word in passing | `{"message":"password reset help"}` | 1. `POST`.<br>2. Identify which article was returned. | Whichever the database returns first, since `FirstOrDefault` runs over an unordered list. Relevance plays no part, so the answer may be the weaker article. Follows from GAP-106. | Not Run |
| TC-34-013 | Unpublished articles are never used | Positive | P3 | A draft article that would match the question | A matching message | 1. `POST`. | `handedOff: true`. The query filters on `Published`, so drafts cannot leak to customers through the bot. Record as verified. | Not Run |
| TC-34-014 | An empty knowledge base always hands off | Edge | P3 | `SEED-EMPTY` | Any message | 1. `POST`. | `handedOff: true` every time. With nothing to match, the bot is a pure fallback. | Not Run |
| TC-34-015 | Hand-off creates nothing | Negative | P3 | `SEED-EMPTY`; note the current ticket and notification counts | `{"message":"I need a human"}` | 1. `POST`.<br>2. Count tickets and notifications; check the audit log. | `handedOff: true`, but no ticket is created, no agent is notified and nothing is logged. The promise "I'll connect you with a human agent" is not kept by any code — the flag is cosmetic. Raise as a functional defect — GAP-107. | Not Run |
| TC-34-016 | The conversation is not persisted | Negative | P3 | API running | Three messages in one session | 1. `POST` three times with the same `sessionId`.<br>2. Search the database for a chat session or transcript. | Nothing is stored. Spec 34 lists `id`, `customerId`, `messages` and `handedOff` as data fields; none has a table. An agent picking up a hand-off has no transcript to read. **Expected to fail against the spec** — GAP-105. | Not Run |
| TC-34-017 | The bot has no customer identity | Negative | P3 | API running | Any message | 1. `POST`.<br>2. Inspect the request contract. | `ChatbotMessageRequest` has only `Message` and `SessionId`. There is no `customerId`, so a reply can never be personalised and a hand-off could not be attributed to a customer even if one were created. | Not Run |
| TC-34-018 | Every article is loaded into memory on every call | Edge | P3 | 2,000 published articles | Any message | 1. `POST` and measure the response time. | The service calls `ToListAsync()` on all published articles and filters in memory, so every question loads the entire knowledge base including full bodies. Response time grows linearly with the article count. Raise as a performance defect — GAP-108. | Not Run |
| TC-34-019 | Arabic questions never match | Negative | P3 | A published Arabic article | An Arabic question matching it | 1. `POST`.<br>2. Read the reply. | Matching is a lower-cased substring comparison, so an Arabic question **can** match Arabic article text — confirm it does. If it does not, the bot is English-only, which conflicts with story 53. Record the actual behaviour. | Not Run |
| TC-34-020 | The endpoint is public and unthrottled | Security | P3 | API running | Any message | 1. `POST` 200 times in a loop with no credentials. | All succeed. Given TC-34-018, each call loads the whole knowledge base, so an unauthenticated public endpoint with no rate limit is a denial-of-service surface as well as an access one. Raise the combined risk. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-34-001, TC-34-004 | Single-turn only |
| AC-2 Invalid input → 400 | TC-34-008, TC-34-009 | |
| AC-3 Not found | TC-34-004, TC-34-014 | A miss hands off rather than erroring |
| AC-4 Authorization | TC-34-020 | Intentionally public, but unthrottled |
| Data fields `messages`, `customerId`, `handedOff` | TC-34-016, TC-34-017 | No storage exists — GAP-105 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-105 | Sessions are not persisted. `sessionId` is echoed but carries no context, and spec 34's `messages` and `customerId` fields have no storage. |
| GAP-106 | Matching succeeds on any single word over three characters, with no relevance scoring, so replies are frequently unrelated to the question. |
| GAP-107 | `handedOff: true` creates no ticket and notifies no agent — the hand-off promised to the customer never happens. |
| GAP-108 | Every call loads all published articles with their full bodies into memory. |
