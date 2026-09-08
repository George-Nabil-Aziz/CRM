# Test Cases — 08 Update ticket status

| | |
|---|---|
| **Story** | [`stories/08-update-ticket-status`](../../../stories/08-update-ticket-status/story.md) |
| **Spec** | [`specs/08-update-ticket-status`](../../../specs/08-update-ticket-status/spec.md) |
| **Area** | Ticket Management |
| **Priority** | P1 |
| **Endpoints** | `PATCH /api/tickets/{id}/status` |
| **Implementation** | [`TicketsController.cs`](../../../backend/CrmApi/Controllers/TicketsController.cs) |
| **UI** | [`ticket-detail.page.ts`](../../../frontend/src/app/pages/ticket-detail.page.ts) — one button per status |

## The state machine as implemented

| From | Allowed to | Blocked to |
|---|---|---|
| `Open` | `Pending`, `Resolved` | `Closed` |
| `Pending` | `Open`, `Resolved` | `Closed` |
| `Resolved` | `Closed`, `Open` | `Pending` |
| `Closed` | `Open` | `Pending`, `Resolved` |

Two rules sit outside the table:

- Setting a ticket to the status it already holds returns `200 OK` and does **nothing** — no
  event is written.
- `ResolvedAt` is stamped on the first transition into `Resolved` and never overwritten.

Note that no path reaches `Closed` without passing through `Resolved`, and `Pending` is
unreachable from `Resolved` or `Closed`.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-08-001 | Walk the full legal lifecycle | Positive | P1 | A new `Open` ticket | `Pending`, then `Resolved`, then `Closed` | 1. `PATCH .../status` to `Pending`.<br>2. To `Resolved`.<br>3. To `Closed`. | `200 OK` at each step and the status advances every time. | Not Run |
| TC-08-002 | Open resolves directly | Positive | P1 | An `Open` ticket | `{"status":"Resolved"}` | 1. `PATCH .../status` to `Resolved`. | `200 OK` — a ticket may skip `Pending` entirely. | Not Run |
| TC-08-003 | Pending returns to Open | Positive | P1 | A `Pending` ticket | `{"status":"Open"}` | 1. `PATCH .../status` to `Open`. | `200 OK` with `status: "Open"`. | Not Run |
| TC-08-004 | Resolved reopens to Open | Positive | P1 | A `Resolved` ticket | `{"status":"Open"}` | 1. `PATCH .../status` to `Open`. | `200 OK` — a customer replying to a resolved case can be handled by reopening. | Not Run |
| TC-08-005 | Closed reopens to Open | Positive | P1 | A `Closed` ticket | `{"status":"Open"}` | 1. `PATCH .../status` to `Open`. | `200 OK` with `status: "Open"`. | Not Run |
| TC-08-006 | Open cannot jump to Closed | Negative | P1 | An `Open` ticket | `{"status":"Closed"}` | 1. `PATCH .../status` to `Closed`. | `400 Bad Request` carrying `Cannot transition ticket from 'Open' to 'Closed'.` and an `allowedTransitions` array holding `Pending` and `Resolved`. The status is unchanged. | Not Run |
| TC-08-007 | Pending cannot jump to Closed | Negative | P1 | A `Pending` ticket | `{"status":"Closed"}` | 1. `PATCH .../status` to `Closed`. | `400 Bad Request` listing `Open` and `Resolved` as the allowed targets. | Not Run |
| TC-08-008 | Resolved cannot go back to Pending | Negative | P1 | A `Resolved` ticket | `{"status":"Pending"}` | 1. `PATCH .../status` to `Pending`. | `400 Bad Request` listing `Closed` and `Open`. | Not Run |
| TC-08-009 | Closed cannot go to Resolved or Pending | Negative | P1 | A `Closed` ticket | `{"status":"Resolved"}`, then `{"status":"Pending"}` | 1. `PATCH` once per value. | `400 Bad Request` both times, with `Open` as the only allowed target. | Not Run |
| TC-08-010 | Setting the current status is a silent no-op | Edge | P2 | An `Open` ticket | `{"status":"Open"}` | 1. `PATCH .../status` to `Open`.<br>2. `GET .../history`. | `200 OK`, the ticket is unchanged, and **no** `StatusChange` event is written — the equality check returns before the event is created. | Not Run |
| TC-08-011 | Resolving stamps the resolution time | Positive | P1 | An `Open` ticket with `ResolvedAt` unset | `{"status":"Resolved"}` | 1. Note the current time.<br>2. `PATCH .../status` to `Resolved`.<br>3. Read the stored `ResolvedAt`. | `200 OK` and `ResolvedAt` holds a UTC time within a few seconds of the request. | Not Run |
| TC-08-012 | Resolution time survives reopen and re-resolve | Edge | P2 | A `Resolved` ticket with a known `ResolvedAt` | `Open`, then `Resolved` | 1. Reopen the ticket.<br>2. Resolve it again.<br>3. Compare `ResolvedAt` with the original. | The **original** value is preserved — the stamp is applied only when the field is null. SLA and agent reports therefore measure the first resolution, not the last. Confirm this is the intended reporting semantics. | Not Run |
| TC-08-013 | Every real change writes a history event | Positive | P1 | An `Open` ticket | Two transitions | 1. Move `Open → Pending`, then `Pending → Resolved`.<br>2. `GET .../history`. | Two `StatusChange` events with `details` of the form `Status changed from 'X' to 'Y'.` | Not Run |
| TC-08-014 | A rejected transition writes no event | Negative | P1 | An `Open` ticket | `{"status":"Closed"}` | 1. Attempt the illegal transition.<br>2. `GET .../history`. | No event is added — the guard returns before the event is written. | Not Run |
| TC-08-015 | A missing or invalid status is rejected | Negative | P1 | An existing ticket | `{}`, then `{"status":"Archived"}` | 1. `PATCH` once per case. | `400 Bad Request` both times. | Not Run |
| TC-08-016 | Update the status of a ticket that does not exist | Negative | P1 | API running | A random UUID | 1. `PATCH /api/tickets/{random-uuid}/status`. | `404 Not Found`. | Not Run |
| TC-08-017 | A status change fires the `ticket.updated` webhook | Positive | P2 | A webhook subscribed to `ticket.updated`; a listener capturing deliveries | — | 1. Change a ticket's status.<br>2. Inspect the listener. | One `POST` arrives carrying the updated ticket as JSON. | Not Run |
| TC-08-018 | A no-op fires no webhook | Edge | P2 | An `Open` ticket; a subscriber to `ticket.updated` | `{"status":"Open"}` | 1. `PATCH` to the same status.<br>2. Inspect the listener. | Nothing is dispatched — the early return happens before the webhook call. | Not Run |
| TC-08-019 | Resolving does not stop the SLA monitor from escalating | Edge | P2 | A ticket resolved after its `ResolutionTargetAt` has already passed | — | 1. Let the target pass.<br>2. Resolve the ticket.<br>3. Trigger a monitor run. | The ticket is **not** escalated — the monitor scans only `Open` and `Pending`. A late resolution therefore avoids escalation, so breach reporting must come from the SLA report, not from the `escalated` flag. | Not Run |
| TC-08-020 | Unauthorized caller cannot change status | Security | P1 | Auth layer deployed | No credentials | 1. `PATCH .../status` with no `Authorization` header. | `401 Unauthorized` and no change persisted. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-08-001…005, TC-08-011, TC-08-013 | |
| AC-2 Invalid input → 400 | TC-08-006…009, TC-08-015 | |
| AC-3 Not found | TC-08-016 | |
| AC-4 Authorization → 401/403 | TC-08-020 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-50 | `ResolvedAt` records only the first resolution. A reopened and re-resolved ticket reports its original resolution time, understating the true handling duration. |
| GAP-51 | A ticket resolved after its SLA target has passed is never flagged as breached, because the monitor scans only `Open` and `Pending`. The `escalated` flag is therefore not a reliable breach indicator. |
