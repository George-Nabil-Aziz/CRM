# Test Cases — 09 Escalate tickets

| | |
|---|---|
| **Story** | [`stories/09-escalate-tickets`](../../../stories/09-escalate-tickets/story.md) |
| **Spec** | [`specs/09-escalate-tickets`](../../../specs/09-escalate-tickets/spec.md) |
| **Area** | Ticket Management |
| **Priority** | P1 |
| **Endpoints** | `POST /api/tickets/{id}/escalate` |
| **Implementation** | [`TicketsController.cs`](../../../backend/CrmApi/Controllers/TicketsController.cs), [`SlaMonitorService.cs`](../../../backend/CrmApi/Services/SlaMonitorService.cs) |
| **UI** | [`ticket-detail.page.ts`](../../../frontend/src/app/pages/ticket-detail.page.ts) — reason field plus a danger button |

## Manual and automatic escalation share one flag

`Escalated` is a single boolean with no source marker, so a ticket escalated by an agent and one
escalated by the SLA monitor are indistinguishable except by their history text and reason.

| Source | Reason text | History event | Webhook payload |
|---|---|---|---|
| Agent — this story | Whatever the agent typed | `Escalated: <reason>` | The full ticket |
| SLA monitor — story 24 | `SLA resolution target breached.` | `Auto-escalated: SLA resolution target breached.` | Five fields only |

Because the flag is shared, the first escalation of either kind blocks the other — several
cases below probe that interaction.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-09-001 | Escalate a ticket with a reason | Positive | P1 | A non-escalated ticket | `{"reason":"Customer is a key account and has waited 3 days."}` | 1. `POST /api/tickets/{id}/escalate`.<br>2. Inspect the response. | `200 OK`. `escalated` is `true`, `escalatedAt` is a UTC timestamp, and `escalationReason` matches the submitted text exactly. | Not Run |
| TC-09-002 | Escalation writes a history event | Positive | P1 | TC-09-001 has passed | — | 1. `GET /api/tickets/{id}/history`. | An `Escalation` event exists with `details` reading `Escalated: <reason>`. | Not Run |
| TC-09-003 | Escalating without a reason is rejected | Negative | P1 | A non-escalated ticket | `{"reason":""}` | 1. `POST .../escalate`. | `400 Bad Request` naming `Reason`. The ticket is not escalated. | Not Run |
| TC-09-004 | Escalating with the reason omitted is rejected | Negative | P1 | A non-escalated ticket | `{}` | 1. `POST .../escalate`. | `400 Bad Request` naming `Reason`. | Not Run |
| TC-09-005 | A ticket in any status can be escalated | Edge | P2 | Four tickets, one in each status | A valid reason | 1. `POST .../escalate` on each. | `200 OK` for all four. There is no status guard, so even a `Closed` ticket can be escalated. Confirm whether escalating a closed ticket should be allowed. | Not Run |
| TC-09-006 | Escalating twice is a silent no-op | Edge | P2 | An already-escalated ticket | A **different** reason | 1. `POST .../escalate` again with new text.<br>2. Read the ticket and count `Escalation` events. | `200 OK`, but the original `escalationReason` and `escalatedAt` are kept and no second event is written. The agent's new reason is discarded with no feedback that it was ignored. Raise as a usability defect — GAP-52. | Not Run |
| TC-09-007 | A ticket auto-escalated by the monitor cannot be escalated manually | Edge | P2 | A ticket already escalated by the SLA monitor | An agent's reason | 1. `POST .../escalate` with the agent's reason.<br>2. Read `escalationReason`. | `200 OK` but the reason stays `SLA resolution target breached.` An agent cannot add their own context to a ticket the system escalated first. Follows from GAP-52. | Not Run |
| TC-09-008 | A manually escalated ticket is skipped by the monitor | Edge | P2 | A ticket escalated by an agent whose `ResolutionTargetAt` then passes | — | 1. Escalate manually.<br>2. Back-date the resolution target.<br>3. Trigger a monitor run. | No second escalation and the agent's reason survives — the monitor filters on `!t.Escalated`. Note the consequence: a real SLA breach on this ticket produces no `SlaBreach` notification, because the manual escalation already consumed the flag. | Not Run |
| TC-09-009 | Escalation fires the `ticket.escalated` webhook | Positive | P2 | A webhook subscribed to `ticket.escalated`; a listener capturing deliveries | — | 1. Escalate a ticket.<br>2. Inspect the delivered body. | One signed delivery carrying the **full** ticket. Compare with the monitor's payload, which carries only five fields — consumers must handle both shapes. Evidence for GAP-33. | Not Run |
| TC-09-010 | Escalation notifies nobody | Negative | P2 | An assigned, non-escalated ticket | A valid reason | 1. Escalate manually.<br>2. `GET /api/notifications?userId={assignee}`. | No notification is written. Automatic escalation notifies the assignee; manual escalation does not notify anyone, including any supervisor. Evidence for GAP-53. | Not Run |
| TC-09-011 | A ticket cannot be de-escalated | Negative | P2 | An escalated ticket | — | 1. Look for a route or payload that clears `escalated`. | There is none. Escalation is irreversible, so a ticket escalated in error stays flagged forever and remains invisible to the SLA monitor. Evidence for GAP-54. | Not Run |
| TC-09-012 | Escalate a ticket that does not exist | Negative | P1 | API running | A random UUID | 1. `POST /api/tickets/{random-uuid}/escalate`. | `404 Not Found`. | Not Run |
| TC-09-013 | Escalation does not change status, priority or assignee | Edge | P2 | An `Open`, `Low`, assigned ticket | A valid reason | 1. Note status, priority and assignee.<br>2. Escalate.<br>3. Re-read all three. | All unchanged. Escalation only raises a flag — it does not reprioritise the ticket or route it to a senior agent. Confirm against the product intent of story 09. | Not Run |
| TC-09-014 | Unauthorized caller cannot escalate | Security | P1 | Auth layer deployed | No credentials | 1. `POST .../escalate` with no `Authorization` header. | `401 Unauthorized` and no change persisted. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-09-001, TC-09-002 | |
| AC-2 Invalid input → 400 | TC-09-003, TC-09-004 | |
| AC-3 Not found / conflict | TC-09-012, TC-09-006 | A repeat escalation returns `200`, not `409` |
| AC-4 Authorization → 401/403 | TC-09-014 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-33 | The manual and automatic `ticket.escalated` webhooks carry different payload shapes. |
| GAP-52 | A second escalation silently discards the new reason instead of recording it or returning a conflict. |
| GAP-53 | Manual escalation notifies nobody, while automatic escalation notifies the assignee. |
| GAP-54 | Escalation cannot be undone, and an escalated ticket is permanently excluded from SLA monitoring. |
| GAP-55 | Escalation raises a flag but does not change priority, status or assignment, so nothing about the ticket's handling actually changes. |
