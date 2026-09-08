# Integration Tests — CRM

Behaviour that spans more than one service. Each case below crosses at least two of:
`ChannelIngestionService`, `TicketAutomationService`, `AiService`, `SlaMonitorService`,
`WebhookDispatcher`, `AuditLogger`, and the controllers.

These are the cases most likely to catch real regressions, because every one exercises a chain
that no single-endpoint test covers.

## Test environment

| Requirement | Why |
|---|---|
| A real SQL Server database, restored to a known seed per run | The chains depend on persisted state |
| A webhook listener capturing method, headers and body | Six of these cases assert on deliveries |
| A way to invoke `SlaMonitorService.RunOnceAsync` directly | The timer ticks once a minute with no trigger endpoint (GAP-09) |
| The ability to back-date `ResolutionTargetAt` in the database | Breach cases without waiting hours |

---

## The main ingestion chain

| ID | Title | Pri | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|
| INT-001 | Unknown sender → customer → ticket → categorisation → SLA → assignment → webhook | P1 | `SEED-EMPTY`. One SLA rule for `Billing`/`Medium` with a 30/240 target. One assignment rule for `Billing` → agent A. A webhook subscribed to `ticket.created`. | 1. `POST /api/channels/email/inbound` from an unknown address with a body containing `I was charged twice`.<br>2. Inspect the customer, ticket, message, targets, assignment, history and listener. | **One call produces seven outcomes.** A customer is created with the email as name and address. A ticket is created `Open`/`Medium`, categorised `Billing` by keyword. `ResponseTargetAt` and `ResolutionTargetAt` are stamped 30 and 240 minutes after creation. `AssignedAgentId` is agent A. One `Assignment` history event reads `Auto-assigned to agent … by rule …`. The message is attached with `channel: Email`. One webhook delivery arrives carrying the full ticket. | Not Run |
| INT-002 | A second message appends and triggers nothing | P1 | INT-001 has passed | 1. `POST` a second inbound email from the same sender with a new `providerDeliveryId`.<br>2. Inspect the ticket, targets and listener. | The message joins the same ticket. No new ticket, no new targets, no re-categorisation, no new assignment event and **no webhook** — the event fires only on creation. | Not Run |
| INT-003 | A provider retry changes nothing | P1 | INT-001 has passed | 1. `POST` the identical payload including the same `providerDeliveryId`.<br>2. Count messages and deliveries. | The original message is returned, the count is unchanged and nothing is dispatched. | Not Run |
| INT-004 | All five channels converge on one ticket | P2 | A customer whose email and phone are both on file, holding one `Open` ticket | 1. Send one inbound message per channel, spaced in time.<br>2. `GET /api/tickets/{id}/messages`. | All five land on the same ticket, ordered by `sentAt`, each labelled with its own channel. This is the payoff for stories 11–16. | Not Run |
| INT-005 | Ingestion is atomic | P2 | A matching assignment rule; force `SaveChangesAsync` to fail | 1. `POST` an inbound email from an unknown sender while the failure is in place.<br>2. Inspect customers, tickets, messages and events. | Nothing is persisted — no orphan customer and no ticket without its message. Customer, ticket, automation and message share one `SaveChangesAsync`. | Not Run |

## The SLA chain

| ID | Title | Pri | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|
| INT-006 | Warning → breach → escalation → notification → webhook | P1 | An `Open` ticket assigned to agent A with a resolution target 10 minutes ahead. A webhook subscribed to `ticket.escalated`. | 1. Run the monitor — expect a warning.<br>2. Back-date the target one hour.<br>3. Run the monitor again.<br>4. Inspect the ticket, history, notifications and listener. | Run 1 writes one `SlaWarning` and changes nothing else. Run 2 sets `escalated`, `escalatedAt` and the reason `SLA resolution target breached.`, writes an `Escalation` event reading `Auto-escalated: …`, writes one `SlaBreach` notification to agent A, and dispatches one webhook carrying the **five-field** payload. | Not Run |
| INT-007 | The chain is idempotent across runs | P1 | INT-006 has passed | 1. Run the monitor twice more.<br>2. Recount events, notifications and deliveries. | No change to any of them — the `!Escalated` filter and the existing-warning check both hold. | Not Run |
| INT-008 | Manual escalation pre-empts the whole SLA chain | P2 | An assigned ticket whose target will pass | 1. Escalate manually with a reason.<br>2. Back-date the target and run the monitor.<br>3. Inspect the reason, events and notifications. | The agent's reason survives, no second event is written, and **no `SlaBreach` notification is ever produced** — the manual escalation consumed the flag. A real breach therefore goes unreported (GAP-54). | Not Run |
| INT-009 | Resolving before the monitor runs avoids escalation entirely | P2 | An assigned ticket whose target has already passed | 1. `PATCH .../status` to `Resolved`.<br>2. Run the monitor.<br>3. `GET /api/reports/sla`. | The ticket is **not** escalated — the scan covers only `Open` and `Pending`. But the SLA report **does** count it as a miss, because `ResolvedAt > ResolutionTargetAt`. The two views disagree by design; confirm both and document which is authoritative (GAP-51). | Not Run |
| INT-010 | An unassigned breach escalates in silence | P2 | An unassigned ticket with a past target | 1. Run the monitor.<br>2. Inspect the ticket and all notifications. | Escalated, with an event and a webhook — but no notification anywhere, because there is no assignee to address (GAP-30). | Not Run |
| INT-011 | A monitor failure is survivable | P2 | Several breached tickets; the database made unavailable mid-run | 1. Run the monitor while the failure is in place.<br>2. Restore and run again. | The first run logs `SLA monitor run failed` and the host stays up. The second run processes the full backlog with no tickets skipped or double-escalated. | Not Run |

## The assignment-rule chain

| ID | Title | Pri | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|
| INT-012 | Specificity beats order across ticket creation | P2 | A catch-all rule → agent A `order: 1`; a `Billing` rule → agent B `order: 99` | 1. Create a `Billing` ticket and an `Account` ticket. | The `Billing` ticket goes to **B** despite the higher order; the `Account` ticket goes to A. Verified end to end through the API rather than against the service. | Not Run |
| INT-013 | Rules apply to channel-created tickets too | P2 | An assignment rule for `Technical` → agent A | 1. `POST` an inbound email whose body contains `crash`. | The auto-created ticket is categorised `Technical` **and** auto-assigned to A. Two services chained: `AiService.Categorize` feeds the category that `TicketAutomationService` then matches on. | Not Run |
| INT-014 | Rules apply to portal-created tickets | P2 | An assignment rule and an SLA rule matching `Billing`/`Medium` | 1. `POST /api/portal/tickets` in `Billing`. | Assigned and SLA-stamped — `PortalController` calls the same automation service. Note the portal forces `Medium`, so only `Medium` rules can ever match a portal ticket. | Not Run |

## Cross-feature consistency

| ID | Title | Pri | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|
| INT-015 | A ticket's full lifecycle is reflected everywhere | P1 | `SEED-BASE` | 1. Create, assign, move to `Pending`, `Resolved`, then `Closed`.<br>2. Check the ticket, its history, the agent queue, the dashboard and the SLA report. | Every surface agrees. History holds one `Assignment` and three `StatusChange` events; the agent queue includes the ticket at every stage; the reports count it in the right group. | Not Run |
| INT-016 | Feedback flows from portal to report | P2 | A `Resolved` ticket | 1. `POST` feedback with rating 5.<br>2. `GET /api/reports/csat` and `GET /api/reports/dashboard`. | `responseCount` rises by one, the average moves accordingly, and the dashboard's `csat` section matches the standalone report exactly. | Not Run |
| INT-017 | Customer history reflects tickets and notes together | P2 | A customer | 1. Create a ticket, add a note, then send an inbound message.<br>2. `GET /api/customers/{id}/history`. | The ticket and the note appear, newest first. The **message does not** — history is ticket-and-note level only. Confirm this is intended (see TC-03-007). | Not Run |
| INT-018 | The knowledge base feeds the chatbot | P2 | `SEED-EMPTY` | 1. Create an article about password resets and publish it.<br>2. Ask the chatbot about passwords.<br>3. Unpublish is impossible, so instead create a second unpublished draft and ask about its content. | The published article's body is returned; the draft's is not. Two features chained through the `Published` flag. | Not Run |
| INT-019 | Resolved tickets feed AI suggested solutions | P2 | `SEED-EMPTY` | 1. Create and resolve three `Technical` tickets.<br>2. Create a fourth `Technical` ticket.<br>3. `GET .../ai/suggest-solutions` on it. | The three resolved tickets are returned, newest resolution first, and the new ticket never suggests itself. | Not Run |
| INT-020 | Mentions reach the notification list | P2 | A ticket and two agents | 1. Post an internal note mentioning both.<br>2. Read each agent's notifications, then mark one read. | One `Mention` each; the read one leaves the unread list. Note the mentioned agents cannot read the note itself (GAP-26). | Not Run |
| INT-021 | Audited actions accumulate correctly | P2 | `SEED-EMPTY` | 1. Create a role, a user, an article; publish the article; change permissions; change a setting.<br>2. `GET /api/audit-logs`. | Six entries in reverse-chronological order with the right actions and target types. Every `actorId` is null (GAP-137), and the setting entry's target is `Guid.Empty` (GAP-139). | Not Run |

## Webhook delivery

| ID | Title | Pri | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|
| INT-022 | Every event type reaches a subscriber | P2 | A webhook subscribed to all three events; a listener | 1. Create a ticket, change its status, escalate it manually, then trigger an SLA breach on another ticket. | Four deliveries: `ticket.created`, `ticket.updated`, and two `ticket.escalated`. Confirm the two escalation payloads **differ in shape** — full ticket versus five fields (GAP-33). | Not Run |
| INT-023 | A broken subscriber never breaks the product | P1 | A subscriber whose URL refuses connections | 1. Create a ticket, change its status and escalate it. | Every API call succeeds normally and all three tickets are correct. The failures are logged and swallowed. **This is the most important resilience case in the suite** — a partner outage must never affect the CRM. | Not Run |
| INT-024 | A slow subscriber does not stall the request | P2 | A subscriber that delays 30 seconds | 1. Create a ticket and time the response. | Measure and record. Dispatch is awaited inline before the response returns, so a slow subscriber may delay the caller — confirm whether an HTTP client timeout bounds it, and raise a defect if a single slow partner can hold ticket creation open. | Not Run |
| INT-025 | Missed events are lost permanently | P2 | A subscriber that is down, then restored | 1. Create three tickets while it is down.<br>2. Restore it and wait five minutes. | Nothing arrives. There is no retry and no delivery log, so neither side can detect the loss (GAP-158). | Not Run |

## End-to-end journeys

| ID | Title | Pri | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|
| INT-026 | Customer emails in and is resolved | P1 | `SEED-EMPTY` with SLA and assignment rules; a webhook listener | 1. Inbound email from an unknown sender.<br>2. Agent reads the queue, opens the ticket, reads context and the AI summary.<br>3. Agent moves it to `Pending`, then `Resolved`.<br>4. Customer submits feedback rating 5.<br>5. Check the dashboard. | The whole journey completes. Every intermediate state is correct and the dashboard reflects one resolved ticket, one SLA measurement and one CSAT response. **This is the primary happy path of the product.** | Not Run |
| INT-027 | Ticket breaches SLA and is escalated | P1 | An assigned ticket with a short SLA | 1. Let the target pass, or back-date it.<br>2. Run the monitor.<br>3. Agent reads the notification and resolves the ticket.<br>4. Check the SLA report. | Escalation, notification and webhook all fire; the report shows the breach as a miss. | Not Run |
| INT-028 | Customer self-serves through the portal | P2 | `SEED-EMPTY` with a customer and a published article | 1. Browse `GET /api/portal/kb` and search it.<br>2. Submit a ticket through the portal.<br>3. Track it, then list request history.<br>4. Agent resolves it; customer submits feedback. | Each step works. Record the two dead ends the journey hits: the customer cannot **read** an article they found (GAP-114) and cannot see the conversation on their ticket (GAP-65). | Not Run |
| INT-029 | Multi-channel conversation on one issue | P2 | A customer with both email and phone on file | 1. Customer emails, then sends WhatsApp, then SMS.<br>2. Agent opens the thread and the AI summary.<br>3. Agent resolves the ticket. | All three messages sit on one ticket in time order; the summary quotes the first and last and counts three. | Not Run |
| INT-030 | A fresh deployment behaves sanely | P2 | `SEED-EMPTY`, migrations applied, nothing configured | 1. Open all six UI pages.<br>2. Call every list endpoint.<br>3. Create a customer and a ticket with no rules configured. | No errors anywhere. Empty states throughout. The ticket is created unassigned with no SLA targets and an empty history — a first-run system must be usable, not broken. | Not Run |
