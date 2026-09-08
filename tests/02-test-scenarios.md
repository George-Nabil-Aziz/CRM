# Test Scenarios — CRM

A scenario is a single testable intent stated in one line. Each one is expanded into
step-by-step cases in [`test-cases/`](test-cases/), and the `Cases` column names
the detailed cases that cover it.

**Legend** — Type: `Positive` / `Negative` / `Edge` / `Security`.
Security scenarios are all currently **Blocked** (see GAP-01 in the
[test strategy](01-test-strategy.md#9-known-gaps-and-blocked-coverage)).

---

## Area 1 — Customer Management (stories 01–04, P1)

| Scenario ID | Story | Scenario | Type | Priority | Cases |
|---|---|---|---|---|---|
| TS-01-01 | 01 | An agent creates a customer with a valid name, email and phone | Positive | P1 | TC-01-001 |
| TS-01-02 | 01 | Creating a customer whose email already exists is rejected as a conflict | Negative | P1 | TC-01-002 |
| TS-01-03 | 01 | Creating a customer with a missing or malformed field is rejected with a field-level error | Negative | P1 | TC-01-003 |
| TS-01-04 | 01 | A newly created customer appears immediately in the customer list | Positive | P1 | TC-01-004 |
| TS-01-05 | 01 | An unauthenticated caller cannot create a customer | Security | P1 | TC-01-005 |
| TS-02-01 | 02 | An agent updates a customer's phone, email and address together | Positive | P1 | TC-02-001 |
| TS-02-02 | 02 | A partial update changes only the supplied fields and leaves the rest intact | Positive | P1 | TC-02-002 |
| TS-02-03 | 02 | Changing a customer's email to one already used by another customer is rejected | Negative | P1 | TC-02-003 |
| TS-02-04 | 02 | Re-submitting a customer's own unchanged email succeeds rather than conflicting | Edge | P2 | TC-02-004 |
| TS-02-05 | 02 | Updating a customer that does not exist returns not-found | Negative | P1 | TC-02-005 |
| TS-03-01 | 03 | An agent views a customer's interaction history in reverse-chronological order | Positive | P1 | TC-03-001 |
| TS-03-02 | 03 | History for a customer with no interactions returns an empty collection, not an error | Edge | P2 | TC-03-002 |
| TS-03-03 | 03 | Each history entry links back to the ticket it came from | Positive | P1 | TC-03-003 |
| TS-03-04 | 03 | History for a non-existent customer returns not-found | Negative | P2 | TC-03-004 |
| TS-04-01 | 04 | An agent adds a note to a customer and it is persisted with author and timestamp | Positive | P1 | TC-04-001 |
| TS-04-02 | 04 | A note can carry an optional attachment URL | Positive | P2 | TC-04-002 |
| TS-04-03 | 04 | An empty note body is rejected | Negative | P1 | TC-04-003 |
| TS-04-04 | 04 | Notes appear on the customer's history in the order they were added | Positive | P2 | TC-04-004 |

## Area 2 — Ticket Management (stories 05–10, P1)

| Scenario ID | Story | Scenario | Type | Priority | Cases |
|---|---|---|---|---|---|
| TS-05-01 | 05 | An agent creates a ticket for an existing customer and it opens with status `Open` | Positive | P1 | TC-05-001 |
| TS-05-02 | 05 | A created ticket receives a unique, non-empty ticket number | Positive | P1 | TC-05-002 |
| TS-05-03 | 05 | Creating a ticket for a customer that does not exist is rejected | Negative | P1 | TC-05-003 |
| TS-05-04 | 05 | Creating a ticket with a missing subject, category or priority is rejected | Negative | P1 | TC-05-004 |
| TS-05-05 | 05 | Creating a ticket with an unrecognised category or priority value is rejected | Negative | P1 | TC-05-005 |
| TS-05-06 | 05 | Two identical creation requests produce two independent tickets | Edge | P2 | TC-05-006 |
| TS-05-07 | 05 | The ticket list returns the most recent tickets first and is capped | Edge | P2 | TC-05-007 |
| TS-05-08 | 05 | An unauthorized caller cannot create a ticket | Security | P1 | TC-05-008 |
| TS-06-01 | 06 | An agent changes a ticket's category and priority | Positive | P1 | TC-06-001 |
| TS-06-02 | 06 | Supplying only a category leaves the priority unchanged | Positive | P1 | TC-06-002 |
| TS-06-03 | 06 | An empty update body leaves the ticket unchanged and still succeeds | Edge | P2 | TC-06-003 |
| TS-06-04 | 06 | An invalid category or priority value is rejected | Negative | P1 | TC-06-004 |
| TS-06-05 | 06 | Updating a ticket that does not exist returns not-found | Negative | P1 | TC-06-005 |
| TS-07-01 | 07 | An agent assigns a ticket to another agent | Positive | P1 | TC-07-001 |
| TS-07-02 | 07 | Assignment writes an `Assignment` event to the ticket history | Positive | P1 | TC-07-002 |
| TS-07-03 | 07 | Re-assigning an already-assigned ticket replaces the assignee | Positive | P1 | TC-07-003 |
| TS-07-04 | 07 | Assigning with a missing or malformed agent id is rejected | Negative | P1 | TC-07-004 |
| TS-07-05 | 07 | Assigning a ticket that does not exist returns not-found | Negative | P1 | TC-07-005 |
| TS-08-01 | 08 | An agent moves a ticket through the legal path Open → Pending → Resolved → Closed | Positive | P1 | TC-08-001 |
| TS-08-02 | 08 | Resolving a ticket stamps its resolution time | Positive | P1 | TC-08-002 |
| TS-08-03 | 08 | An illegal transition is rejected and the response lists the legal ones | Negative | P1 | TC-08-003 |
| TS-08-04 | 08 | Setting a ticket to the status it already holds succeeds as a no-op | Edge | P2 | TC-08-004 |
| TS-08-05 | 08 | A closed ticket can be reopened to `Open` | Positive | P1 | TC-08-005 |
| TS-08-06 | 08 | Each status change writes a `StatusChange` event to history | Positive | P1 | TC-08-006 |
| TS-09-01 | 09 | An agent escalates a ticket with a reason | Positive | P1 | TC-09-001 |
| TS-09-02 | 09 | Escalation records the reason, the timestamp and an `Escalation` history event | Positive | P1 | TC-09-002 |
| TS-09-03 | 09 | Escalating without a reason is rejected | Negative | P1 | TC-09-003 |
| TS-09-04 | 09 | Escalating an already-escalated ticket behaves predictably | Edge | P2 | TC-09-004 |
| TS-10-01 | 10 | An agent views a ticket's full history in chronological order | Positive | P1 | TC-10-001 |
| TS-10-02 | 10 | History contains one entry per lifecycle action across all event types | Positive | P1 | TC-10-002 |
| TS-10-03 | 10 | History for a brand-new ticket is empty or contains only its creation events | Edge | P2 | TC-10-003 |
| TS-10-04 | 10 | History for a non-existent ticket returns not-found | Negative | P2 | TC-10-004 |

## Area 3 — Communication Channels (stories 11–16, P2)

| Scenario ID | Story | Scenario | Type | Priority | Cases |
|---|---|---|---|---|---|
| TS-11-01 | 11 | An inbound email from a known customer is appended to their open ticket | Positive | P2 | TC-11-001 |
| TS-11-02 | 11 | An inbound email from an unknown sender creates both a customer and a ticket | Positive | P2 | TC-11-002 |
| TS-11-03 | 11 | A repeated provider delivery id is ignored rather than duplicated | Edge | P2 | TC-11-003 |
| TS-11-04 | 11 | An inbound email with a malformed sender address is rejected | Negative | P2 | TC-11-004 |
| TS-12-01 | 12 | An inbound WhatsApp message is matched to a customer by phone number | Positive | P2 | TC-12-001 |
| TS-12-02 | 12 | An unknown WhatsApp sender gets a placeholder customer record | Edge | P2 | TC-12-002 |
| TS-12-03 | 12 | An inbound WhatsApp message with an empty body is rejected | Negative | P2 | TC-12-003 |
| TS-13-01 | 13 | A live-chat message is posted and stored on the `Chat` channel | Positive | P2 | TC-13-001 |
| TS-13-02 | 13 | Consecutive chat messages land on the same open ticket | Positive | P2 | TC-13-002 |
| TS-13-03 | 13 | The specified WebSocket transport does not exist | Negative | P3 | TC-13-003 |
| TS-14-01 | 14 | An inbound SMS is ingested and stored on the `Sms` channel | Positive | P2 | TC-14-001 |
| TS-14-02 | 14 | An SMS from a phone number that also has an email record matches the same customer | Edge | P3 | TC-14-002 |
| TS-15-01 | 15 | A web-form submission creates a ticket with the submitted subject | Positive | P2 | TC-15-001 |
| TS-15-02 | 15 | A web-form submission with an invalid email is rejected | Negative | P2 | TC-15-002 |
| TS-15-03 | 15 | A very long web-form message is truncated when used as the ticket subject | Edge | P2 | TC-15-003 |
| TS-16-01 | 16 | A ticket's message thread returns messages from every channel in one ordered list | Positive | P2 | TC-16-001 |
| TS-16-02 | 16 | Each message in the thread reports its originating channel | Positive | P2 | TC-16-002 |
| TS-16-03 | 16 | The thread of a ticket with no messages is empty, not an error | Edge | P2 | TC-16-003 |

## Area 4 — Agent Dashboard (stories 17–21, P2)

| Scenario ID | Story | Scenario | Type | Priority | Cases |
|---|---|---|---|---|---|
| TS-17-01 | 17 | An agent sees only the tickets assigned to them | Positive | P2 | TC-17-001 |
| TS-17-02 | 17 | An agent with no assigned tickets sees an empty list | Edge | P2 | TC-17-002 |
| TS-17-03 | 17 | Without an authenticated identity, "my tickets" cannot be scoped | Security | P2 | TC-17-003 |
| TS-18-01 | 18 | Opening a ticket shows the customer's name, email, phone and recent tickets | Positive | P2 | TC-18-001 |
| TS-18-02 | 18 | Context for a ticket whose customer has no other tickets shows an empty recent list | Edge | P3 | TC-18-002 |
| TS-18-03 | 18 | Context for a non-existent ticket returns not-found | Negative | P2 | TC-18-003 |
| TS-19-01 | 19 | An agent creates a reminder on a ticket with a due time | Positive | P2 | TC-19-001 |
| TS-19-02 | 19 | A reminder due in the past is handled predictably | Edge | P3 | TC-19-002 |
| TS-19-03 | 19 | A reminder with a missing note or agent id is rejected | Negative | P2 | TC-19-003 |
| TS-20-01 | 20 | An agent lists the available quick replies | Positive | P2 | TC-20-001 |
| TS-20-02 | 20 | An agent creates a new quick reply | Positive | P2 | TC-20-002 |
| TS-20-03 | 20 | A quick reply with an empty title or body is rejected | Negative | P2 | TC-20-003 |
| TS-21-01 | 21 | An agent posts an internal note that is not visible on the customer thread | Positive | P2 | TC-21-001 |
| TS-21-02 | 21 | Mentioning a colleague in an internal note raises a `Mention` notification | Positive | P2 | TC-21-002 |
| TS-21-03 | 21 | An internal note with an empty body is rejected | Negative | P2 | TC-21-003 |

## Area 5 — SLA & Automation (stories 22–25, P2)

| Scenario ID | Story | Scenario | Type | Priority | Cases |
|---|---|---|---|---|---|
| TS-22-01 | 22 | An administrator creates an SLA rule for a category and priority pair | Positive | P2 | TC-22-001 |
| TS-22-02 | 22 | A new ticket matching a rule receives response and resolution target times | Positive | P2 | TC-22-002 |
| TS-22-03 | 22 | A ticket with no matching rule is created with no SLA targets | Edge | P2 | TC-22-003 |
| TS-22-04 | 22 | A rule with a zero or negative target is rejected | Negative | P2 | TC-22-004 |
| TS-23-01 | 23 | A new ticket is auto-assigned by a matching category rule | Positive | P2 | TC-23-001 |
| TS-23-02 | 23 | A category-specific rule wins over a catch-all rule | Edge | P2 | TC-23-002 |
| TS-23-03 | 23 | Among rules of equal specificity the lowest `Order` wins | Edge | P2 | TC-23-003 |
| TS-23-04 | 23 | With no rules configured the ticket is created unassigned | Edge | P2 | TC-23-004 |
| TS-24-01 | 24 | A ticket past its resolution target is auto-escalated by the monitor | Positive | P2 | TC-24-001 |
| TS-24-02 | 24 | An already-escalated ticket is not escalated twice | Edge | P2 | TC-24-002 |
| TS-24-03 | 24 | Resolved and closed tickets are never auto-escalated | Edge | P2 | TC-24-003 |
| TS-24-04 | 24 | A failing monitor run does not crash the host or block the next run | Edge | P2 | TC-24-004 |
| TS-25-01 | 25 | An SLA breach notifies the assigned agent | Positive | P2 | TC-25-001 |
| TS-25-02 | 25 | A ticket approaching its target within the warning window notifies the agent once | Positive | P2 | TC-25-002 |
| TS-25-03 | 25 | A warning is not repeated on later monitor runs | Edge | P2 | TC-25-003 |
| TS-25-04 | 25 | An unassigned ticket produces no notification | Edge | P2 | TC-25-004 |
| TS-25-05 | 25 | An agent marks a notification as read | Positive | P2 | TC-25-005 |

## Area 6 — Knowledge Base (stories 26–29, P3)

| Scenario ID | Story | Scenario | Type | Priority | Cases |
|---|---|---|---|---|---|
| TS-26-01 | 26 | A user browses the published FAQ list | Positive | P3 | TC-26-001 |
| TS-26-02 | 26 | Unpublished drafts are excluded from the FAQ list | Positive | P3 | TC-26-002 |
| TS-27-01 | 27 | A user opens a published article by id and sees its full body | Positive | P3 | TC-27-001 |
| TS-27-02 | 27 | Requesting an article that does not exist returns not-found | Negative | P3 | TC-27-002 |
| TS-27-03 | 27 | Requesting an unpublished article is not served to a public reader | Negative | P3 | TC-27-003 |
| TS-28-01 | 28 | Searching returns articles whose title matches the query | Positive | P3 | TC-28-001 |
| TS-28-02 | 28 | A search with no matches returns an empty list, not an error | Edge | P3 | TC-28-002 |
| TS-28-03 | 28 | An empty or whitespace query is handled without error | Edge | P3 | TC-28-003 |
| TS-29-01 | 29 | An author creates a knowledge-base article as a draft | Positive | P3 | TC-29-001 |
| TS-29-02 | 29 | An author publishes a draft and it becomes publicly visible | Positive | P3 | TC-29-002 |
| TS-29-03 | 29 | Creating an article with an empty title or body is rejected | Negative | P3 | TC-29-003 |
| TS-29-04 | 29 | Publishing an already-published article is idempotent | Edge | P3 | TC-29-004 |

## Area 7 — AI Features (stories 30–34, P3)

| Scenario ID | Story | Scenario | Type | Priority | Cases |
|---|---|---|---|---|---|
| TS-30-01 | 30 | An agent requests a summary of a ticket that has messages | Positive | P3 | TC-30-001 |
| TS-30-02 | 30 | A summary of a ticket with no messages states that there are none | Edge | P3 | TC-30-002 |
| TS-30-03 | 30 | A summary of a single-message ticket omits the "most recent" clause | Edge | P3 | TC-30-003 |
| TS-30-04 | 30 | A summary of a non-existent ticket returns not-found | Negative | P3 | TC-30-004 |
| TS-31-01 | 31 | A suggested reply matches the ticket's category | Positive | P3 | TC-31-001 |
| TS-31-02 | 31 | A ticket in the `General` category receives the generic fallback reply | Edge | P3 | TC-31-002 |
| TS-31-03 | 31 | The suggestion is returned to the agent and never sent automatically | Positive | P3 | TC-31-003 |
| TS-32-01 | 32 | An inbound message containing a billing keyword is categorised as `Billing` | Positive | P3 | TC-32-001 |
| TS-32-02 | 32 | A message with no recognised keyword falls back to `General` | Edge | P3 | TC-32-002 |
| TS-32-03 | 32 | Keyword matching is case-insensitive | Edge | P3 | TC-32-003 |
| TS-32-04 | 32 | A message matching keywords in two categories resolves deterministically | Edge | P3 | TC-32-004 |
| TS-33-01 | 33 | An agent receives related past tickets as suggested solutions | Positive | P3 | TC-33-001 |
| TS-33-02 | 33 | A ticket with no comparable history returns an empty suggestion list | Edge | P3 | TC-33-002 |
| TS-34-01 | 34 | A customer sends a chatbot message and receives a reply | Positive | P3 | TC-34-001 |
| TS-34-02 | 34 | A follow-up message in the same session keeps its conversation context | Positive | P3 | TC-34-002 |
| TS-34-03 | 34 | An empty chatbot message is rejected | Negative | P3 | TC-34-003 |
| TS-34-04 | 34 | A conversation the bot cannot handle is flagged for hand-off | Edge | P3 | TC-34-004 |

## Area 8 — Customer Portal (stories 35–39, P3)

| Scenario ID | Story | Scenario | Type | Priority | Cases |
|---|---|---|---|---|---|
| TS-35-01 | 35 | A customer submits a ticket through the portal | Positive | P3 | TC-35-001 |
| TS-35-02 | 35 | A portal ticket is created with the same defaults as an agent-created ticket | Positive | P3 | TC-35-002 |
| TS-35-03 | 35 | A portal submission with a missing description is rejected | Negative | P3 | TC-35-003 |
| TS-35-04 | 35 | A customer cannot submit a ticket on another customer's behalf | Security | P3 | TC-35-004 |
| TS-36-01 | 36 | A customer views the current status of one of their requests | Positive | P3 | TC-36-001 |
| TS-36-02 | 36 | Requesting a ticket that does not exist returns not-found | Negative | P3 | TC-36-002 |
| TS-36-03 | 36 | A customer cannot read another customer's ticket | Security | P3 | TC-36-003 |
| TS-37-01 | 37 | A customer lists their full request history | Positive | P3 | TC-37-001 |
| TS-37-02 | 37 | A customer with no requests sees an empty history | Edge | P3 | TC-37-002 |
| TS-38-01 | 38 | A customer browses the portal knowledge base | Positive | P3 | TC-38-001 |
| TS-38-02 | 38 | Internal-only content never appears in the portal knowledge base | Positive | P3 | TC-38-002 |
| TS-39-01 | 39 | A customer submits a satisfaction rating with a comment | Positive | P3 | TC-39-001 |
| TS-39-02 | 39 | A rating outside 1–5 is rejected | Negative | P3 | TC-39-002 |
| TS-39-03 | 39 | Ratings at the boundaries 1 and 5 are accepted | Edge | P3 | TC-39-003 |
| TS-39-04 | 39 | Feedback without a comment is accepted | Edge | P3 | TC-39-004 |

## Area 9 — Reports & Management (stories 40–44, P3)

| Scenario ID | Story | Scenario | Type | Priority | Cases |
|---|---|---|---|---|---|
| TS-40-01 | 40 | A manager runs the ticket report grouped by status | Positive | P3 | TC-40-001 |
| TS-40-02 | 40 | The same report can be grouped by category and by priority | Positive | P3 | TC-40-002 |
| TS-40-03 | 40 | An unrecognised `groupBy` value is handled without a server error | Negative | P3 | TC-40-003 |
| TS-40-04 | 40 | The report over an empty database returns zeroed totals | Edge | P3 | TC-40-004 |
| TS-41-01 | 41 | The SLA report distinguishes met from breached targets | Positive | P3 | TC-41-001 |
| TS-41-02 | 41 | Tickets with no SLA targets are excluded from SLA percentages | Edge | P3 | TC-41-002 |
| TS-42-01 | 42 | The agent report shows ticket counts and resolution times per agent | Positive | P3 | TC-42-001 |
| TS-42-02 | 42 | An agent with no resolved tickets shows a zero, not a division error | Edge | P3 | TC-42-002 |
| TS-43-01 | 43 | The CSAT report averages the submitted ratings | Positive | P3 | TC-43-001 |
| TS-43-02 | 43 | CSAT with no submitted feedback returns a null or zero average rather than failing | Edge | P3 | TC-43-002 |
| TS-44-01 | 44 | The dashboard returns ticket, SLA, agent and CSAT summaries in one response | Positive | P3 | TC-44-001 |
| TS-44-02 | 44 | The dashboard renders on an empty database without error | Edge | P3 | TC-44-002 |

## Area 10 — Security & Administration (stories 45–48, P2)

| Scenario ID | Story | Scenario | Type | Priority | Cases |
|---|---|---|---|---|---|
| TS-45-01 | 45 | An administrator creates a user and assigns a role | Positive | P2 | TC-45-001 |
| TS-45-02 | 45 | Creating a user with a role that does not exist is rejected | Negative | P2 | TC-45-002 |
| TS-45-03 | 45 | Creating a user with a malformed email is rejected | Negative | P2 | TC-45-003 |
| TS-45-04 | 45 | Only an administrator may create users | Security | P2 | TC-45-004 |
| TS-46-01 | 46 | An administrator replaces a role's permission set | Positive | P2 | TC-46-001 |
| TS-46-02 | 46 | Clearing a role's permissions leaves it with none | Edge | P2 | TC-46-002 |
| TS-46-03 | 46 | Updating permissions on a role that does not exist returns not-found | Negative | P2 | TC-46-003 |
| TS-46-04 | 46 | Permission changes have no runtime effect while no auth layer exists | Security | P2 | TC-46-004 |
| TS-47-01 | 47 | Privileged actions are written to the audit log | Positive | P2 | TC-47-001 |
| TS-47-02 | 47 | Each audit entry records actor, action, target and timestamp | Positive | P2 | TC-47-002 |
| TS-47-03 | 47 | Audit entries cannot be modified or deleted through the API | Security | P2 | TC-47-003 |
| TS-48-01 | 48 | An administrator sets a configuration value and reads it back | Positive | P2 | TC-48-001 |
| TS-48-02 | 48 | Setting an existing key overwrites its value rather than duplicating it | Edge | P2 | TC-48-002 |
| TS-48-03 | 48 | Reading a key that was never set returns not-found | Negative | P2 | TC-48-003 |
| TS-48-04 | 48 | A setting with an empty key is rejected | Negative | P2 | TC-48-004 |

## Area 11 — Integrations (stories 49–52, P4)

| Scenario ID | Story | Scenario | Type | Priority | Cases |
|---|---|---|---|---|---|
| TS-49-01 | 49 | An administrator issues an API key with scopes | Positive | P4 | TC-49-001 |
| TS-49-02 | 49 | An issued key can be retrieved by id | Positive | P4 | TC-49-002 |
| TS-49-03 | 49 | The key secret is not exposed in plain text on later reads | Security | P4 | TC-49-003 |
| TS-50-01 | 50 | An ERP sync run records a log entry with its outcome | Positive | P4 | TC-50-001 |
| TS-50-02 | 50 | A failed sync is logged as `Failed` and does not abort the request | Edge | P4 | TC-50-002 |
| TS-50-03 | 50 | Sync logs can be listed for review | Positive | P4 | TC-50-003 |
| TS-51-01 | 51 | An administrator configures an email, SMS or WhatsApp channel | Positive | P4 | TC-51-001 |
| TS-51-02 | 51 | A configured channel is listed with its status | Positive | P4 | TC-51-002 |
| TS-51-03 | 51 | Configuring a channel with an unrecognised type is rejected | Negative | P4 | TC-51-003 |
| TS-51-04 | 51 | Channel credentials are not returned in plain text | Security | P4 | TC-51-004 |
| TS-52-01 | 52 | A webhook subscriber receives a signed `ticket.created` delivery | Positive | P4 | TC-52-001 |
| TS-52-02 | 52 | The signature header is an HMAC-SHA256 of the body using the stored secret | Positive | P4 | TC-52-002 |
| TS-52-03 | 52 | A subscriber that is unreachable does not fail the triggering request | Edge | P4 | TC-52-003 |
| TS-52-04 | 52 | An event with no subscribers dispatches nothing | Edge | P4 | TC-52-004 |

## Area 12 — Platform (stories 53–57, P4)

| Scenario ID | Story | Scenario | Type | Priority | Cases |
|---|---|---|---|---|---|
| TS-53-01 | 53 | Content submitted in Arabic is stored and returned unchanged | Positive | P4 | TC-53-001 |
| TS-53-02 | 53 | Mixed Arabic and English content in one field survives a round trip | Edge | P4 | TC-53-002 |
| TS-53-03 | 53 | The UI has no language switcher | Negative | P4 | TC-53-003 |
| TS-54-01 | 54 | Every page is usable at a mobile viewport width | Positive | P4 | TC-54-001 |
| TS-54-02 | 54 | Wide data tables remain reachable on a narrow screen | Edge | P4 | TC-54-002 |
| TS-55-01 | 55 | An administrator creates a department and lists it | Positive | P4 | TC-55-001 |
| TS-55-02 | 55 | Creating a department with an empty name is rejected | Negative | P4 | TC-55-002 |
| TS-56-01 | 56 | An administrator creates a branch with a location and lists it | Positive | P4 | TC-56-001 |
| TS-56-02 | 56 | Creating a branch with an empty name is rejected | Negative | P4 | TC-56-002 |
| TS-57-01 | 57 | An administrator sets the branding logo and colours | Positive | P4 | TC-57-001 |
| TS-57-02 | 57 | Branding is read back with the values that were saved | Positive | P4 | TC-57-002 |
| TS-57-03 | 57 | The endpoint method differs from the published contract | Negative | P4 | TC-57-003 |

---

## Scenario count by area

| Area | Scenarios | Positive | Negative | Edge | Security |
|---|---|---|---|---|---|
| 1. Customer Management | 18 | 9 | 6 | 2 | 1 |
| 2. Ticket Management | 32 | 15 | 10 | 6 | 1 |
| 3. Communication Channels | 18 | 9 | 4 | 5 | 0 |
| 4. Agent Dashboard | 15 | 7 | 4 | 3 | 1 |
| 5. SLA & Automation | 17 | 7 | 1 | 9 | 0 |
| 6. Knowledge Base | 12 | 6 | 3 | 3 | 0 |
| 7. AI Features | 17 | 7 | 2 | 8 | 0 |
| 8. Customer Portal | 15 | 7 | 3 | 3 | 2 |
| 9. Reports & Management | 12 | 6 | 1 | 5 | 0 |
| 10. Security & Administration | 15 | 5 | 5 | 2 | 3 |
| 11. Integrations | 14 | 8 | 1 | 3 | 2 |
| 12. Platform | 12 | 6 | 4 | 2 | 0 |
| **Total** | **197** | **92** | **44** | **51** | **10** |
