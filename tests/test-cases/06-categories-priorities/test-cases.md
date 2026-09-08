# Test Cases — 06 Categories and priorities

| | |
|---|---|
| **Story** | [`stories/06-categories-priorities`](../../../stories/06-categories-priorities/story.md) |
| **Spec** | [`specs/06-categories-priorities`](../../../specs/06-categories-priorities/spec.md) |
| **Area** | Ticket Management |
| **Priority** | P1 |
| **Endpoints** | `PATCH /api/tickets/{id}` |
| **Implementation** | [`TicketsController.cs`](../../../backend/CrmApi/Controllers/TicketsController.cs) |
| **UI** | [`ticket-detail.page.ts`](../../../frontend/src/app/pages/ticket-detail.page.ts) |

## Allowed values

| Field | Values |
|---|---|
| `category` | `Billing`, `Technical`, `Account`, `General`, `FeatureRequest` |
| `priority` | `Low`, `Medium`, `High`, `Urgent` |

Both are nullable on the request, so either may be sent alone. Anything absent is left as is.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-06-001 | Change category and priority together | Positive | P1 | A `Technical`/`High` ticket exists | `{"category":"Billing","priority":"Urgent"}` | 1. `PATCH /api/tickets/{id}`.<br>2. Re-read the ticket. | `200 OK` and both values are updated and persist. | Not Run |
| TC-06-002 | Change only the category | Positive | P1 | A ticket with a known priority | `{"category":"Account"}` | 1. `PATCH` with category only.<br>2. Re-read the ticket. | `200 OK`. `category` changes; `priority` keeps its previous value. | Not Run |
| TC-06-003 | Change only the priority | Positive | P1 | A ticket with a known category | `{"priority":"Low"}` | 1. `PATCH` with priority only.<br>2. Re-read the ticket. | `200 OK`. `priority` changes; `category` is untouched. | Not Run |
| TC-06-004 | Every category value is accepted | Positive | P1 | An existing ticket | Each of the five categories in turn | 1. `PATCH` once per value.<br>2. Re-read after each. | `200 OK` every time and the stored value matches. Confirms `FeatureRequest` binds from the string `"FeatureRequest"`. | Not Run |
| TC-06-005 | Every priority value is accepted | Positive | P1 | An existing ticket | Each of the four priorities in turn | 1. `PATCH` once per value.<br>2. Re-read after each. | `200 OK` every time and the stored value matches. | Not Run |
| TC-06-006 | An empty body is accepted as a no-op | Edge | P2 | An existing ticket | `{}` | 1. `PATCH /api/tickets/{id}` with an empty object. | `200 OK` and the ticket is unchanged — both fields are nullable so nothing is applied. | Not Run |
| TC-06-007 | An explicit null leaves the field unchanged | Edge | P2 | A `Billing` ticket | `{"category":null,"priority":"High"}` | 1. `PATCH` with an explicit null category.<br>2. Re-read the ticket. | `200 OK`. `category` stays `Billing` — null means "not supplied", so a field can never be cleared. | Not Run |
| TC-06-008 | An invalid category value is rejected | Negative | P1 | An existing ticket | `{"category":"Nonsense"}` | 1. `PATCH /api/tickets/{id}`. | `400 Bad Request`. The ticket is unchanged. | Not Run |
| TC-06-009 | An invalid priority value is rejected | Negative | P1 | An existing ticket | `{"priority":"Critical"}` | 1. `PATCH /api/tickets/{id}`. | `400 Bad Request`. Note `Critical` is a plausible-looking value that the enum does not define. | Not Run |
| TC-06-010 | Update a ticket that does not exist | Negative | P1 | API running | A random UUID | 1. `PATCH /api/tickets/{random-uuid}`. | `404 Not Found`. | Not Run |
| TC-06-011 | The change is not written to ticket history | Negative | P2 | An existing ticket | `{"category":"Billing"}` | 1. `PATCH` the category.<br>2. `GET /api/tickets/{id}/history`. | No new event appears. Assignment, status change and escalation are all audited; re-categorisation is not, so story 10's "full history" has a hole. Evidence for GAP-15. | Not Run |
| TC-06-012 | The change does not recompute SLA targets | Edge | P2 | SLA rules exist for `Technical`/`Low` and `Technical`/`Urgent`; a `Technical`/`Low` ticket | `{"priority":"Urgent"}` | 1. Note `ResponseTargetAt` and `ResolutionTargetAt`.<br>2. `PATCH` the priority up to `Urgent`.<br>3. Re-read both fields. | The targets are unchanged. `TicketAutomationService` runs only on create, so raising a ticket's priority does not tighten its SLA and the monitor keeps using the old deadline. Evidence for GAP-31. | Not Run |
| TC-06-013 | The change does not re-run auto-assignment | Edge | P2 | Assignment rules routing `Billing` to agent A and `Technical` to agent B; a `Billing` ticket assigned to A | `{"category":"Technical"}` | 1. `PATCH` the category to `Technical`.<br>2. Re-read `assignedAgentId`. | Still agent A. Re-categorising does not re-route the ticket to the team that owns the new category. Confirm against the product intent of story 23. | Not Run |
| TC-06-014 | Unauthorized caller cannot re-categorise | Security | P1 | Auth layer deployed | No credentials | 1. `PATCH /api/tickets/{id}` with no `Authorization` header. | `401 Unauthorized` and no change persisted. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-06-001…005 | |
| AC-2 Invalid input → 400 | TC-06-008, TC-06-009 | |
| AC-3 Not found | TC-06-010 | |
| AC-4 Authorization → 401/403 | TC-06-014 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-15 | Category and priority changes write no history event. |
| GAP-31 | SLA targets are computed only at creation and are never recomputed when priority or category changes. |
| GAP-46 | Re-categorising does not re-run auto-assignment, so a ticket stays with the team that owned its original category. |
