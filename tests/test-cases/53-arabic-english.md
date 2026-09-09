# Test Cases — 53 Arabic and English

| | |
|---|---|
| **Story** | [`stories/53-arabic-english`](../../../stories/53-arabic-english/story.md) |
| **Spec** | [`specs/53-arabic-english`](../../../specs/53-arabic-english/spec.md) |
| **Area** | Platform |
| **Priority** | P4 |
| **Endpoints** | None — this is a cross-cutting requirement |
| **Implementation** | **None found.** No resource files, no localisation middleware, no `Accept-Language` handling, no `dir` attribute in the Angular app |

## What exists and what does not

Bilingual support has two halves, and only one is present.

| Half | Status |
|---|---|
| **Data** — storing and returning Arabic content unchanged | Works, by virtue of SQL Server `nvarchar` and UTF-8 JSON |
| **Interface** — Arabic labels, RTL layout, a language switcher | **Absent entirely** |

Several features are also hard-coded to English and cannot serve an Arabic user regardless of
layout: AI suggested replies (GAP-93), automatic categorisation keywords (GAP-98) and the
chatbot's fallback message.

The cases below verify the data half thoroughly and record the interface half as missing.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-53-001 | An Arabic customer name round-trips | Positive | P4 | API running | `{"name":"ليلى حسن","email":"layla@example.com","phone":"+201000000001"}` | 1. `POST /api/customers`.<br>2. `GET /api/customers/{id}`. | The name returns byte-identical, with no mojibake, no escaping and no question marks. | Not Run |
| TC-53-002 | An Arabic ticket subject round-trips | Positive | P4 | An existing customer | Subject `لا أستطيع تسجيل الدخول` | 1. `POST /api/tickets`.<br>2. Read the ticket back. | The subject returns unchanged. | Not Run |
| TC-53-003 | An Arabic message body round-trips | Positive | P4 | A known customer | An Arabic inbound email body | 1. `POST /api/channels/email/inbound`.<br>2. `GET /api/tickets/{id}/messages`. | The body returns unchanged. | Not Run |
| TC-53-004 | An Arabic knowledge-base article round-trips | Positive | P4 | API running | An article with an Arabic title and body | 1. `POST /api/kb/articles`, publish it, then read it. | Title and body both return unchanged. | Not Run |
| TC-53-005 | Mixed Arabic and English in one field | Edge | P4 | An existing customer | Subject `مشكلة في الـ login page` | 1. Create the ticket and read it back. | The mixed string returns intact, including the embedded Latin words and the surrounding Arabic. | Not Run |
| TC-53-006 | Arabic-Indic digits are preserved | Edge | P4 | An existing customer | A note containing `رقم الفاتورة ١٢٣٤٥` | 1. `POST /api/customers/{id}/notes` and read it back. | The Arabic-Indic digits are stored as submitted and are **not** normalised to `12345`. | Not Run |
| TC-53-007 | Arabic search matches Arabic content | Positive | P4 | A published article with an Arabic body | An Arabic substring, URL-encoded, as `q` | 1. `GET /api/kb/search?q={arabic}`. | The article is returned, confirming `LIKE` matching works over Unicode. | Not Run |
| TC-53-008 | Arabic customer search matches | Positive | P4 | A customer named `ليلى حسن` | `?q=ليلى` | 1. `GET /api/customers?q={arabic}`. | The customer is returned. | Not Run |
| TC-53-009 | Arabic text is not truncated mid-character | Edge | P4 | A ticket whose only message body is 400 Arabic characters | — | 1. `GET /api/tickets/{id}/ai/summary`. | The 160-character truncation produces valid text with no replacement characters and no split surrogate pairs. Arabic is in the BMP so this should hold — confirm, and repeat with an emoji in the body, which is not. | Not Run |
| TC-53-010 | A very long Arabic string is stored whole | Edge | P4 | An existing customer | A 5,000-character Arabic note | 1. `POST` the note and read it back. | Either the full text round-trips or the request fails cleanly on a column limit. Verify no silent truncation — a length limit counted in bytes rather than characters would cut Arabic at roughly half the expected length. | Not Run |
| TC-53-011 | Suggested replies are English only | Negative | P4 | A `Billing` ticket whose messages are all Arabic | — | 1. `POST /api/tickets/{id}/ai/suggest-reply`. | An English reply. The five suggestion strings are hard-coded, so an agent serving an Arabic customer is handed an English draft. **Expected to fail against story 53** — GAP-93. | Not Run |
| TC-53-012 | Auto-categorisation never fires on Arabic | Negative | P4 | An unknown sender | An Arabic inbound message clearly about an invoice | 1. `POST` inbound.<br>2. Read the new ticket's category. | `General`. Every classifier keyword is English, so no Arabic message can ever be categorised. **Expected to fail against story 53** — GAP-98. | Not Run |
| TC-53-013 | The chatbot's fallback is English only | Negative | P4 | `SEED-EMPTY` | An Arabic question | 1. `POST /api/chatbot/message`. | The English hand-off string. An Arabic-speaking customer receives an English apology. | Not Run |
| TC-53-014 | Validation messages are English only | Negative | P4 | API running | An invalid payload | 1. `POST /api/customers` with a bad email.<br>2. Read the `ProblemDetails` body. | English framework text such as `The Email field is not a valid e-mail address.` There is no localisation middleware, so error text cannot be served in Arabic. | Not Run |
| TC-53-015 | The API ignores `Accept-Language` | Negative | P4 | API running | Header `Accept-Language: ar` | 1. Issue any request with the header.<br>2. Compare the response with one sent without it. | Identical. No content negotiation on language exists anywhere in the pipeline. Evidence for GAP-161. | Not Run |
| TC-53-016 | The UI has no language switcher | Negative | P4 | The Angular app running | — | 1. Open every page and look for a language control. | There is none. All labels are hard-coded English strings in the component templates, with no i18n pipes, no translation files and no locale configuration. **Expected to fail against story 53** — GAP-161. | Not Run |
| TC-53-017 | The UI does not switch to RTL for Arabic content | Negative | P4 | A customer named in Arabic and a ticket with an Arabic subject | — | 1. Open the customers page and the ticket detail page.<br>2. Inspect the layout and the `dir` attribute. | The text renders correctly — browsers apply the Unicode bidirectional algorithm to the characters themselves — but the page stays left-to-right. There is no `dir="rtl"`, so alignment, table column order and form layout remain LTR around the Arabic content. Evidence for GAP-161. | Not Run |
| TC-53-018 | Arabic renders without corruption in the UI | Positive | P4 | Arabic customers, tickets and articles | — | 1. Open each page displaying that content. | Characters render correctly with proper letter joining and no boxes or question marks — the app serves UTF-8 and uses system fonts. Layout direction is the separate issue in TC-53-017. | Not Run |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| Data stored and returned unchanged | TC-53-001…010, TC-53-018 | This half works |
| Interface available in both languages | TC-53-016, TC-53-017 | Expected to fail — GAP-161 |
| Features usable in Arabic | TC-53-011…014 | Expected to fail — GAP-93, GAP-98 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-93 | AI suggested replies are hard-coded English strings. |
| GAP-98 | Every auto-categorisation keyword is English, so Arabic messages always fall back to `General`. |
| GAP-161 | No localisation exists: no resource files, no `Accept-Language` handling, no translation pipes, no language switcher and no RTL layout. Only the data layer is bilingual. |
