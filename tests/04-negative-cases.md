# Negative Cases — CRM

277 cases across the suite are typed `Negative`. They live in their story folders under
[`test-cases/`](test-cases/); this document groups them by **failure mode**, so a tester can
verify one class of rejection consistently across the whole API.

The most important thing this view reveals is where the API is *inconsistent* — the same kind of
bad input produces different status codes in different places.

---

## 1. Status code conventions, and where they break

| Situation | Convention | Endpoints that follow it | Endpoints that do not |
|---|---|---|---|
| Missing or malformed field | `400` | Everywhere `[Required]` / `[EmailAddress]` / `[Range]` is applied | — |
| Referenced entity does not exist | `400` per the specs | — | **`404` everywhere**: ticket `customerId` (`TC-05-004`), user `roleId` (`TC-45-006`), portal `customerId` (`TC-35-006`) — GAP-03 |
| Target record does not exist | `404` | All `{id}` routes | — |
| Duplicate unique value | `409` | Customer email, user email, role name, SLA rule pair, feedback | Ticket creation — none (GAP-04); assignment rules, departments, branches, quick replies, articles — all permit duplicates |
| Illegal state transition | `400` | Ticket status (`TC-08-006`) | Escalation returns `200` and silently discards (`TC-09-006`) |
| Unrecognised enum value | `400` | Every enum-bound parameter | `groupBy` on reports — falls back silently (`TC-40-005`) |

**Verify the whole table above as one exercise.** A single inconsistency found here is worth more
than any individual case, because clients build error handling on these conventions.

## 2. Missing required fields

Every `[Required]` field, with the field named in `ProblemDetails.errors`.

| Entity | Required fields | Cases |
|---|---|---|
| Customer | `name`, `email`, `phone` | `TC-01-003…006` |
| Note | `text` | `TC-04-003`, `TC-04-004` |
| Ticket | `customerId`, `subject`, `category`, `priority` | `TC-05-005…009` |
| Assignment | `agentId` | `TC-07-005` |
| Status change | `status` | `TC-08-015` |
| Escalation | `reason` | `TC-09-003`, `TC-09-004` |
| Inbound email | `from`, `subject`, `body` | `TC-11-007…009` |
| Inbound phone | `from`, `body` | `TC-12-005`, `TC-12-006` |
| Web form | `name`, `email`, `subject`, `message` | `TC-15-004…007` |
| Reminder | `agentId`, `dueAt`, `note` | `TC-19-003…006` |
| Quick reply | `title`, `body` | `TC-20-009…011` |
| Internal note | `text`, `authorId` | `TC-21-006`, `TC-21-007` |
| SLA rule | All four | `TC-22-006…009` |
| Assignment rule | `targetAgentId` | `TC-23-012` |
| Article | `title`, `body`, `category`, `type` | `TC-29-006…009` |
| Chatbot | `message` | `TC-34-008`, `TC-34-009` |
| Portal ticket | `customerId`, `subject`, `category`, `description` | `TC-35-007…009` |
| Feedback | `rating` | `TC-39-007` |
| User | `name`, `email`, `roleId` | `TC-45-009`, `TC-45-010` |
| Role | `name` | `TC-45-004` |
| Permissions | `permissions` | `TC-46-004` |
| Setting | `key`, `value` | `TC-48-005`, `TC-48-007` |
| API key | `ownerId` | `TC-49-005` |
| Channel config | `channel`, `credentials` | `TC-51-005`, `TC-51-006` |
| Webhook | `url`, `events` | `TC-52-014` |
| Department | `name` | `TC-55-004`, `TC-55-005` |
| Branch | `name`, `location` | `TC-56-004…006` |

## 3. Validation that is absent

Fields a reader would expect to be validated, that are not. Each row is a defect, and each is
covered by a case asserting the current permissive behaviour.

| Field | Expected | Actual | Case | Gap |
|---|---|---|---|---|
| `Customer.Phone` | Phone format | Any string | `TC-02-010` | GAP-42 |
| `Note.AttachmentUrl` | URL | Any string, `javascript:` accepted | `TC-04-008` | GAP-12 |
| `InboundPhoneMessage.From` | Phone format | Any string becomes a customer name | `TC-12-007` | GAP-60 |
| `Ticket.AgentId` on assign | Must exist | Any UUID | `TC-07-008`, `TC-07-009` | GAP-14 |
| `Reminder.AgentId` | Must exist | Any UUID | `TC-19-009` | GAP-14 |
| `AssignmentRule.TargetAgentId` | Must exist | Any UUID | `TC-23-011` | GAP-14 |
| `InternalNote.MentionedUserIds` | Must exist | Any UUID, duplicates kept | `TC-21-010`, `TC-21-012` | GAP-73 |
| `ApiKey.OwnerId` | Must exist | Any UUID | `TC-49-006` | — |
| SLA rule cross-field | Resolution after response | No check | `TC-22-010` | GAP-75 |
| `Reminder.DueAt` | Future | Past accepted | `TC-19-008` | — |
| `Role.Permissions` | Known vocabulary | Any string | `TC-46-006` | GAP-134 |
| `ApiKey.Scopes` | Known vocabulary | Any string | `TC-49-011` | GAP-134 |
| `Webhook.Events` | Known vocabulary | Any string | `TC-52-016` | — |
| `Setting.Key` | Known vocabulary | Any string | `TC-48-008` | GAP-141 |
| `Branding.LogoUrl` | URL | Any string, `javascript:` accepted | `TC-57-009` | GAP-167 |
| `Branding.PrimaryColor` | Colour format | Any string, CSS injection possible | `TC-57-010` | GAP-167 |
| `Webhook.Url` | **Is** validated by `[Url]` — but no host restriction | Internal addresses reachable | `TC-52-017` | GAP-159 |

## 4. Spec violations — cases expected to fail

These assert the **specified** behaviour and will fail against the current build. They are the
acceptance list for the corresponding fixes.

| Case | Asserts | Gap |
|---|---|---|
| `TC-04-007` | Note carries an `authorId` | GAP-11 |
| `TC-10-011` | Ticket events carry an `actorId` | GAP-13 |
| `TC-10-003` | Messages and notes appear in ticket history | GAP-17 |
| `TC-13-005` | `WS /ws/chat` exists | GAP-06 |
| `TC-18-007` | Ticket context includes `recentTickets` | GAP-24 |
| `TC-29-018` | Articles carry an `authorId` | GAP-36 |
| `TC-30-014` | Summaries carry `generatedAt` | GAP-90 |
| `TC-32-015` | Categorisation returns a confidence score | GAP-97 |
| `TC-33-014` | Suggestions carry `suggestionText` | GAP-102 |
| `TC-34-016` | Chat sessions are persisted | GAP-105 |
| `TC-35-013` | Portal submission is scoped to the authenticated customer | GAP-109 |
| `TC-46-010` | Permissions govern access | GAP-136 |
| `TC-47-009` | Audit entries identify the actor | GAP-137 |
| `TC-48-014` | Settings affect behaviour | GAP-144 |
| `TC-49-010` | API keys control access | GAP-146 |
| `TC-53-011`, `TC-53-012`, `TC-53-016` | The product works in Arabic | GAP-93, GAP-98, GAP-161 |
| `TC-55-010`, `TC-56-012` | Departments and branches organise data | GAP-164, GAP-166 |
| `TC-57-008` | Branding uses `POST` per the contract | GAP-05 |

## 5. Features that are write-only or read-only

Not input rejection, but the negative space of the API — what cannot be done at all.

| Story | Can create | Cannot | Cases | Gap |
|---|---|---|---|---|
| 04 Notes | Yes | Edit, delete | `TC-04-010` | GAP-45 |
| 07 Assignment | Yes | **Unassign** | `TC-07-010` | GAP-47 |
| 09 Escalation | Yes | **De-escalate** | `TC-09-011` | GAP-54 |
| 19 Reminders | Yes | List, dismiss, delete, be notified | `TC-19-010…012` | GAP-25 |
| 20 Quick replies | Yes | Edit, delete | `TC-20-014` | GAP-69 |
| 21 Internal notes | Yes | **List** — collaboration is invisible | `TC-21-013` | GAP-26 |
| 22, 23 Rules | Yes | Edit, delete | `TC-22-014`, `TC-23-016` | GAP-28 |
| 29 Articles | Yes | Edit, unpublish, delete, preview | `TC-29-016`, `TC-29-017` | GAP-34, GAP-35 |
| 39 Feedback | Yes | Read back | `TC-39-018` | GAP-117 |
| 45 Users, roles | Yes | **List**, update, deactivate, delete | `TC-45-014`, `TC-45-015` | GAP-132 |
| 48 Settings | Yes | List, delete | `TC-48-011`, `TC-48-012` | GAP-143 |
| 49 API keys | Yes | List, revoke | `TC-49-012`, `TC-49-013` | GAP-147 |
| 51 Channels | Yes | Update, delete — no credential rotation | `TC-51-010` | GAP-153 |
| 52 Webhooks | Yes | Update, delete | `TC-52-018` | GAP-160 |
| 55, 56 Departments, branches | Yes | Update, delete | `TC-55-009`, `TC-56-011` | GAP-163, GAP-165 |

## 6. Cross-cutting negative cases

Defined here rather than in any single story.

| ID | Title | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| NC-X-01 | Wrong HTTP verb returns 405 | API running | 1. `DELETE /api/tickets`, `PUT /api/customers`, `POST /api/reports/tickets`. | `405 Method Not Allowed` each time — never `404`, and never a `500`. | Not Run |
| NC-X-02 | Wrong content type is rejected | API running | 1. `POST /api/customers` with `Content-Type: text/plain` and a valid JSON body. | `415 Unsupported Media Type`. | Not Run |
| NC-X-03 | An oversized body is rejected cleanly | API running | 1. `POST /api/customers` with a 100 MB body. | A clean `413` or `400`. The process must not exhaust memory or crash. | Not Run |
| NC-X-04 | An unknown JSON property is ignored, not rejected | API running | 1. `POST /api/tickets` with an extra `"injected":"x"` property. | `201 Created` and the property is discarded. Confirm it cannot set a field the DTO does not expose — no over-posting. | Not Run |
| NC-X-05 | A type mismatch returns 400 | API running | 1. `POST /api/tickets` with `"subject": 12345`.<br>2. `POST /api/portal/tickets/{id}/feedback` with `"rating": "five"`. | `400` each time with a `ProblemDetails` body, never a `500`. | Not Run |
| NC-X-06 | SQL metacharacters are handled as data | `SEED-BASE` | 1. Search customers with `?q=' OR 1=1--`.<br>2. Search the KB with the same.<br>3. Create a customer named `Robert'); DROP TABLE Customers;--`. | Treated as literal text throughout. No extra rows returned and no table dropped — EF Core parameterises every query. Record as verified. | Not Run |
| NC-X-07 | Error responses leak no internals | API running, database stopped | 1. Trigger a failure on several endpoints.<br>2. Read each response body. | No stack trace, no connection string, no table or column name, no framework version. | Not Run |
| NC-X-08 | A blocked CORS origin fails at the browser | The Angular app served from a non-allowlisted origin | 1. Load the app and issue any API call. | The browser blocks it. Recognise this as a CORS configuration limit (GAP-162), not an application defect — it is the most likely false bug report in this suite. | Not Run |

---

## Where the remaining negative cases live

Each story folder under [`test-cases/`](test-cases/) carries its own negative cases with the
exact payloads and expected messages. Start from
[`02-test-scenarios.md`](02-test-scenarios.md) to find the story that owns a behaviour.
