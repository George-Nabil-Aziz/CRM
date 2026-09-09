# Test Cases — 24 Escalation rules

| | |
|---|---|
| **Story** | [`stories/24-escalation-rules`](../../../stories/24-escalation-rules/story.md) |
| **Spec** | [`specs/24-escalation-rules`](../../../specs/24-escalation-rules/spec.md) |
| **Area** | SLA & Automation |
| **Priority** | P2 |
| **Contract** | `JOB sla-monitor scheduled job` — **no HTTP endpoint** (GAP-07) |
| **Implementation** | [`SlaMonitorService.cs`](../../../backend/CrmApi/Services/SlaMonitorService.cs) |

## What the monitor does on each tick

It runs every **1 minute** as a hosted `BackgroundService`. Each run performs two scans:

| Scan | Selects | Action |
|---|---|---|
| Breached | `Status` in (`Open`, `Pending`) **and** not `Escalated` **and** `ResolutionTargetAt` < now | Sets `Escalated`, `EscalatedAt` and the reason; writes an `Escalation` event; notifies the assignee; dispatches `ticket.escalated` |
| Approaching | `Status` in (`Open`, `Pending`) **and** not `Escalated` **and** `ResolutionTargetAt` within the next **15 minutes** | Writes one `SlaWarning` notification to the assignee, unless one already exists |

If both scans come back empty the run exits without touching the database.

## Running it deterministically

There is no trigger endpoint (GAP-09). Pick one:

| Method | How | Use when |
|---|---|---|
| Direct call | Resolve the service in a test host and `await RunOnceAsync(CancellationToken.None)` | Automated runs — **preferred** |
| Back-date | Set `ResolutionTargetAt` into the past directly in the database, then wait one tick | Breach cases without long SLA arithmetic |
| Wait | Sleep 65 seconds after arranging the data | Manual execution |

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-24-001 | A ticket past its resolution target is auto-escalated | Positive | P2 | An `Open` assigned ticket with `ResolutionTargetAt` back-dated one hour | — | 1. Trigger a monitor run.<br>2. Re-read the ticket. | `escalated` is `true`, `escalatedAt` is set to the run time, and `escalationReason` reads exactly `SLA resolution target breached.` | Not Run |
| TC-24-002 | Auto-escalation writes a distinguishable history event | Positive | P2 | TC-24-001 has passed | — | 1. `GET /api/tickets/{id}/history`. | One `Escalation` event reading `Auto-escalated: SLA resolution target breached.` — distinct from the manual `Escalated: <reason>`. | Not Run |
| TC-24-003 | A `Pending` ticket is escalated too | Positive | P2 | A `Pending` assigned ticket with a past target | — | 1. Trigger a run.<br>2. Re-read the ticket. | Escalated. Both `Open` and `Pending` are in scope — waiting on the customer does not pause the SLA clock. Confirm against the product intent; most helpdesks pause on `Pending`. | Not Run |
| TC-24-004 | An already-escalated ticket is not escalated twice | Edge | P2 | The breached ticket from TC-24-001 | — | 1. Trigger a second run.<br>2. Count `Escalation` events and re-read `escalatedAt`. | Still exactly one event, and `escalatedAt` is unchanged — the scan filters on `!t.Escalated`. | Not Run |
| TC-24-005 | A manually escalated ticket is skipped | Edge | P2 | A ticket escalated by an agent, whose target then passes | — | 1. Escalate manually.<br>2. Back-date the target and trigger a run. | No second escalation and the agent's reason survives. Note the consequence: this ticket's genuine SLA breach produces **no** `SlaBreach` notification, because the manual escalation consumed the flag — GAP-54. | Not Run |
| TC-24-006 | Resolved and closed tickets are never escalated | Edge | P2 | A `Resolved` and a `Closed` ticket, both with past targets | — | 1. Trigger a run.<br>2. Re-read both. | Neither is escalated. A ticket resolved late therefore never registers as breached, so the `escalated` flag is not a reliable breach metric — use the SLA report instead. See GAP-51. | Not Run |
| TC-24-007 | A ticket with no target is never escalated | Edge | P2 | An `Open` ticket created long ago with `ResolutionTargetAt` null | — | 1. Trigger a run. | Not escalated. Tickets outside SLA rule coverage age indefinitely with no signal at all — pair with TC-22-003 and TC-22-015 when reviewing rule coverage. | Not Run |
| TC-24-008 | A ticket exactly at its target is not yet breached | Edge | P3 | A ticket whose `ResolutionTargetAt` equals the run time to the second | — | 1. Trigger a run at that instant. | Not escalated on this tick — the comparison is strictly `< now`. It escalates on the following tick. Boundary confirmed. | Not Run |
| TC-24-009 | Several breached tickets are escalated in one run | Positive | P2 | Five `Open` assigned tickets all past their targets | — | 1. Trigger a single run.<br>2. Re-read all five. | All five are escalated, each with its own event and notification, in one pass. | Not Run |
| TC-24-010 | An unassigned breached ticket escalates without notifying | Edge | P2 | An unassigned ticket with a past target | — | 1. Trigger a run.<br>2. Re-read the ticket and list all notifications. | The ticket **is** escalated, but no notification exists because notifications are addressed to the assignee. A breach on unassigned work is completely silent — nobody is told. Raise as a defect — GAP-30. | Not Run |
| TC-24-011 | A failing run does not crash the host | Edge | P2 | Force a failure inside the run, for example by taking the database offline | — | 1. Trigger a run with the failure in place.<br>2. Restore the dependency and trigger another run. | The exception is logged as `SLA monitor run failed`, the host stays up, and the next run clears the backlog. The `try/catch` inside the timer loop is what guarantees this. | Not Run |
| TC-24-012 | A quiet run writes nothing | Edge | P2 | No breached and no approaching tickets | — | 1. Trigger a run.<br>2. Inspect the database and any webhook listener. | No notification, no webhook and no `SaveChangesAsync` — the run short-circuits when both collections are empty. | Not Run |
| TC-24-013 | The response target is never enforced | Negative | P2 | A ticket past `ResponseTargetAt` but not past `ResolutionTargetAt` | — | 1. Trigger a run. | Nothing happens. Only the resolution target is scanned, so a first-response breach is invisible to escalation — GAP-29. | Not Run |
| TC-24-014 | Escalation does not change priority or assignment | Edge | P2 | A `Low`, assigned, breached ticket | — | 1. Trigger a run.<br>2. Re-read priority and assignee. | Both unchanged. "Escalation" raises a flag and sends a notification; it does not reprioritise the ticket or route it to a senior agent, so nothing about its handling actually changes — GAP-55. | Not Run |
| TC-24-015 | There is no configurable escalation rule | Negative | P2 | API running | — | 1. Search the API for routes managing escalation rules. | There are none. The behaviour is hard-coded: breach the resolution target, escalate. The escalation policy cannot be configured, staged across levels, or targeted at a supervisor. Story 24 is titled "escalation **rules**" — evidence for GAP-79. | Not Run |
| TC-24-016 | The breach webhook payload is the reduced shape | Edge | P2 | A webhook subscribed to `ticket.escalated`; a breached ticket | — | 1. Trigger a run.<br>2. Inspect the delivered body. | The body carries only `Id`, `TicketNumber`, `Status`, `Category` and `Priority` — not the full ticket that manual escalation sends. Consumers must handle both shapes — GAP-33. | Not Run |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-24-001, TC-24-002, TC-24-009 | Verified through the job, not an endpoint (GAP-07) |
| AC-2 Invalid input → 400 | — | The job takes no external input |
| AC-3 Not found / conflict | TC-24-004, TC-24-005 | Re-escalation is guarded by the `Escalated` flag |
| AC-4 Authorization → 401/403 | — | Not applicable; the job runs in-process with no caller |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-07 | Story 24 has no HTTP surface and is verified through the background job. |
| GAP-09 | The monitor has no on-demand trigger, so timing-dependent cases need a test hook or a 65-second wait. |
| GAP-29 | The response target is never enforced. |
| GAP-30 | A breach on an unassigned ticket is escalated silently, with no notification to anyone. |
| GAP-33 | The automatic and manual `ticket.escalated` payloads differ in shape. |
| GAP-79 | Escalation is hard-coded rather than rule-driven: no configurable thresholds, no multi-level escalation, no supervisor targeting. |
| GAP-80 | The SLA clock keeps running while a ticket is `Pending`, so time spent waiting on the customer counts against the resolution target. |
