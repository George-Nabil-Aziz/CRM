# Test Cases — 39 Submit feedback

| | |
|---|---|
| **Story** | [`stories/39-submit-feedback`](../../../stories/39-submit-feedback/story.md) |
| **Spec** | [`specs/39-submit-feedback`](../../../specs/39-submit-feedback/spec.md) |
| **Area** | Customer Portal |
| **Priority** | P3 |
| **Endpoints** | `POST /api/portal/tickets/{id}/feedback` |
| **Implementation** | [`PortalController.cs`](../../../backend/CrmApi/Controllers/PortalController.cs) |

## Three guards, checked in order

This is the most carefully guarded endpoint in the product, and the order of the checks matters
because it determines which status code a caller sees.

| # | Guard | Failure |
|---|---|---|
| 1 | The ticket exists | `404 Not Found` |
| 2 | Its status is `Resolved` or `Closed` | `400 Bad Request` — `Feedback can only be submitted once the ticket is resolved or closed.` |
| 3 | No feedback exists for it yet | `409 Conflict` — `Feedback has already been submitted for this ticket.` |

`Rating` is `[Required, Range(1, 5)]`; `Comment` is optional.

Note what is **not** guarded: there is no `customerId` on this route at all, so unlike stories 36
and 37 there is not even an ownership check.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-39-001 | Submit a rating with a comment | Positive | P3 | A `Resolved` ticket with no feedback | `{"rating":5,"comment":"Fixed quickly, thank you."}` | 1. `POST /api/portal/tickets/{id}/feedback`. | `201 Created` with a generated `id`, the matching `ticketId`, `rating: 5`, the comment, and a UTC `submittedAt`. | Not Run |
| TC-39-002 | Feedback on a closed ticket is accepted | Positive | P3 | A `Closed` ticket with no feedback | `{"rating":4}` | 1. `POST`. | `201 Created` — guard 2 admits both `Resolved` and `Closed`. | Not Run |
| TC-39-003 | A comment is optional | Edge | P3 | A `Resolved` ticket | `{"rating":3}` | 1. `POST`.<br>2. Inspect the response. | `201 Created` with `comment: null`. A rating alone is a complete submission. | Not Run |
| TC-39-004 | An empty comment is accepted | Edge | P3 | A `Resolved` ticket | `{"rating":3,"comment":""}` | 1. `POST`. | `201 Created` with `comment: ""`. `Comment` carries no `MinLength`, so empty and null are both stored — two representations of "no comment" that reports must handle. | Not Run |
| TC-39-005 | Rating 1 is accepted | Edge | P3 | A `Resolved` ticket | `{"rating":1}` | 1. `POST`. | `201 Created` — the lower boundary of `[Range(1, 5)]`. | Not Run |
| TC-39-006 | Rating 5 is accepted | Edge | P3 | A `Resolved` ticket | `{"rating":5}` | 1. `POST`. | `201 Created` — the upper boundary. | Not Run |
| TC-39-007 | Rating 0 is rejected | Negative | P3 | A `Resolved` ticket | `{"rating":0}` | 1. `POST`. | `400 Bad Request` naming `Rating`. Note that an **omitted** rating also produces `0`, so it fails the same way. | Not Run |
| TC-39-008 | Rating 6 is rejected | Negative | P3 | A `Resolved` ticket | `{"rating":6}` | 1. `POST`. | `400 Bad Request` naming `Rating`. | Not Run |
| TC-39-009 | A negative rating is rejected | Negative | P3 | A `Resolved` ticket | `{"rating":-1}` | 1. `POST`. | `400 Bad Request`. | Not Run |
| TC-39-010 | A non-integer rating is rejected | Negative | P3 | A `Resolved` ticket | `{"rating":4.5}` | 1. `POST`. | `400 Bad Request` — deserialisation to `int` fails. | Not Run |
| TC-39-011 | Feedback on an open ticket is rejected | Negative | P3 | An `Open` ticket | `{"rating":5}` | 1. `POST`. | `400 Bad Request` with `Feedback can only be submitted once the ticket is resolved or closed.` No feedback is stored. | Not Run |
| TC-39-012 | Feedback on a pending ticket is rejected | Negative | P3 | A `Pending` ticket | `{"rating":5}` | 1. `POST`. | `400 Bad Request` with the same message. | Not Run |
| TC-39-013 | Duplicate feedback is rejected | Negative | P3 | A `Resolved` ticket that already has feedback | `{"rating":1,"comment":"Changed my mind"}` | 1. `POST` a second time. | `409 Conflict` with `Feedback has already been submitted for this ticket.` The original rating is unchanged — a customer gets exactly one vote per ticket. | Not Run |
| TC-39-014 | The status guard runs before the duplicate guard | Edge | P3 | An `Open` ticket that somehow already has feedback — seed the row directly | `{"rating":5}` | 1. `POST`. | `400`, not `409` — guard 2 precedes guard 3. Confirms the documented check order. | Not Run |
| TC-39-015 | Feedback on a non-existent ticket | Negative | P3 | API running | A random UUID | 1. `POST /api/portal/tickets/{random-uuid}/feedback`. | `404 Not Found` — guard 1. | Not Run |
| TC-39-016 | Feedback reaches the CSAT report | Positive | P3 | TC-39-001 has passed | — | 1. `GET /api/reports/csat`. | The submitted rating is included in the average. This is the only consumer of feedback data — see story 43. | Not Run |
| TC-39-017 | A reopened ticket still cannot be re-rated | Edge | P3 | A `Resolved` ticket with feedback | Reopen it to `Open`, resolve it again, then submit new feedback | 1. Reopen, re-resolve, then `POST` feedback. | `409 Conflict`. The duplicate guard is keyed on the ticket alone with no notion of a resolution cycle, so a customer who was dissatisfied, had the ticket reopened, and was then satisfied cannot update their rating. Raise as a defect — GAP-116. | Not Run |
| TC-39-018 | Feedback cannot be read back, edited or deleted | Negative | P3 | A ticket with feedback | — | 1. Look for a route returning a ticket's feedback. | There is none — the only read path is the aggregate CSAT report. A customer cannot see what they submitted, and an agent cannot read the comment attached to their own ticket, so free-text feedback is effectively write-only. Raise as a defect — GAP-117. | Not Run |
| TC-39-019 | The `Location` header resolves to a 404 | Edge | P3 | A `Resolved` ticket | A valid feedback payload | 1. `POST`.<br>2. Follow the `Location` header verbatim. | It points at `GET /api/portal/tickets/{id}` **without** the required `customerId` query parameter, so it returns `400` or `404`. The same defect as story 35 — GAP-110. | Not Run |
| TC-39-020 | Submitting feedback notifies nobody | Negative | P3 | A `Resolved` ticket assigned to agent A | `{"rating":1,"comment":"Very poor service"}` | 1. `POST`.<br>2. `GET /api/notifications?userId={A}`. | No notification. A one-star rating with a complaint arrives silently and is visible only as a number in an aggregate report. Raise as a defect — GAP-118. | Not Run |
| TC-39-021 | Anyone can rate any resolved ticket | Security | P3 | A `Resolved` ticket owned by customer A | `{"rating":1}` | 1. `POST /api/portal/tickets/{id}/feedback` with no credentials, as an unrelated caller. | Currently `201 Created`. This route takes **no `customerId` at all**, so it lacks even the ownership check that stories 36 and 37 apply. Anyone holding a ticket id can submit satisfaction scores in a customer's name, and the duplicate guard then locks the real customer out. Evidence for GAP-119 — the most exploitable gap in the portal. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-39-001, TC-39-002, TC-39-016 | |
| AC-2 Invalid input → 400 | TC-39-007…012 | Both the range guard and the status guard |
| AC-3 Conflict → 409 | TC-39-013, TC-39-014 | |
| AC-4 Authorization → 401/403 | TC-39-021 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-110 | The `Location` header omits the `customerId` the read route requires. |
| GAP-116 | The duplicate guard is per ticket, not per resolution cycle, so a reopened and re-resolved ticket can never be re-rated. |
| GAP-117 | Feedback cannot be read back individually. Comments are visible only through the aggregate CSAT report, so free-text feedback is effectively lost. |
| GAP-118 | A low rating raises no notification, so poor feedback reaches nobody. |
| GAP-119 | The route accepts no customer id at all, so anyone with a ticket id can submit feedback in a customer's name and lock out the real one. |
