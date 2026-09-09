# Test Cases — 23 Automatic assignment

| | |
|---|---|
| **Story** | [`stories/23-automatic-assignment`](../../../stories/23-automatic-assignment/story.md) |
| **Spec** | [`specs/23-automatic-assignment`](../../../specs/23-automatic-assignment/spec.md) |
| **Area** | SLA & Automation |
| **Priority** | P2 |
| **Contract** | `EVENT ticket.created event handler` — **no HTTP endpoint of its own** (GAP-07) |
| **Rule management** | `POST /api/assignment-rules`, `GET /api/assignment-rules` |
| **Implementation** | [`TicketAutomationService.cs`](../../../backend/CrmApi/Services/TicketAutomationService.cs), [`AssignmentRulesController.cs`](../../../backend/CrmApi/Controllers/AssignmentRulesController.cs) |

## How a rule is selected

Every ticket creation runs one query. Understanding its ordering is the whole story:

```
rules where (Category is null OR Category == ticket.Category)
  order by (Category is null ? 1 : 0)   -- specific rules before catch-all
  then by Order                          -- lowest Order wins
  take first
```

So **specificity always beats `Order`**: a category-specific rule with `Order = 99` defeats a
catch-all rule with `Order = 1`. `Order` only breaks ties between rules of equal specificity.
A `null` category is the wildcard — unlike SLA rules, which have no wildcard at all.

The chosen rule sets `AssignedAgentId` and writes an `Assignment` history event reading
`Auto-assigned to agent <id> by rule <rule-id>.`, distinguishing it from a manual assignment.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-23-001 | A matching category rule assigns the ticket | Positive | P2 | No rules exist | `{"category":"Billing","targetAgentId":"<A>","order":1}` | 1. `POST /api/assignment-rules`.<br>2. `POST /api/tickets` in `Billing`. | The created ticket has `assignedAgentId` equal to A, with no manual step. | Not Run |
| TC-23-002 | Auto-assignment writes a distinguishable history event | Positive | P2 | TC-23-001 has passed | — | 1. `GET /api/tickets/{id}/history`. | Exactly one `Assignment` event reading `Auto-assigned to agent <A> by rule <rule-id>.` — the wording differs from the manual `Assigned to agent <id>.` | Not Run |
| TC-23-003 | A non-matching category leaves the ticket unassigned | Positive | P2 | Only a `Billing` rule exists | A `Technical` ticket | 1. `POST /api/tickets` in `Technical`. | `assignedAgentId` is `null` and no `Assignment` event is written. | Not Run |
| TC-23-004 | A catch-all rule covers every category | Positive | P2 | One rule with `category: null` → agent A | An `Account` ticket, then a `General` ticket | 1. Create both tickets. | Both are assigned to agent A. A null category is the wildcard. | Not Run |
| TC-23-005 | A category-specific rule beats a catch-all | Edge | P2 | Catch-all → agent A with `order: 1`; `Billing` → agent B with `order: 99` | A `Billing` ticket | 1. Create both rules.<br>2. `POST /api/tickets` in `Billing`. | Agent **B** wins. Specificity is applied before `Order`, so B's much higher order number is irrelevant. This is the single most surprising behaviour in the area — verify it explicitly. | Not Run |
| TC-23-006 | Among equally specific rules the lowest order wins | Edge | P2 | Two `Billing` rules: agent A `order: 5`, agent B `order: 2` | A `Billing` ticket | 1. Create both rules.<br>2. Create a `Billing` ticket. | Agent **B** wins on the lower `Order`. | Not Run |
| TC-23-007 | Among two catch-alls the lowest order wins | Edge | P2 | Two `category: null` rules: agent A `order: 3`, agent B `order: 1` | Any ticket | 1. Create both rules.<br>2. Create a ticket in any category. | Agent B wins. | Not Run |
| TC-23-008 | Two rules with the same specificity and order | Edge | P3 | Two `Billing` rules both with `order: 1`, targeting different agents | A `Billing` ticket | 1. Create both rules.<br>2. Create a `Billing` ticket several times. | One of them wins, but which is **undefined** — the sort keys tie and there is no further tiebreaker. Nothing prevents creating this ambiguity, so assignment becomes non-deterministic. Raise as a defect. | Not Run |
| TC-23-009 | With no rules the ticket stays unassigned | Edge | P2 | No assignment rules | Any ticket | 1. `POST /api/tickets`. | `assignedAgentId` is `null` and history is empty. | Not Run |
| TC-23-010 | Rules are listed in order | Positive | P2 | Three rules with orders 3, 1, 2 | — | 1. `GET /api/assignment-rules`. | `200 OK` with the rules sorted ascending by `Order`. Note the list ignores specificity, so the display order does not reflect which rule would actually win. | Not Run |
| TC-23-011 | A rule may target an agent who does not exist | Negative | P3 | API running | A random UUID as `targetAgentId` | 1. `POST /api/assignment-rules`.<br>2. Create a matching ticket. | `201 Created`, and every matching ticket is then assigned to a non-existent agent — invisible in every real agent's queue. The id is never validated. Raise as a defect — GAP-14. | Not Run |
| TC-23-012 | A missing target agent is rejected | Negative | P2 | API running | `targetAgentId` omitted | 1. `POST /api/assignment-rules`. | `400 Bad Request` naming `TargetAgentId`. | Not Run |
| TC-23-013 | An invalid category value is rejected | Negative | P2 | API running | `"category":"Refunds"` | 1. `POST /api/assignment-rules`. | `400 Bad Request`. | Not Run |
| TC-23-014 | A negative order is accepted | Edge | P3 | API running | `{"category":"Billing","targetAgentId":"<A>","order":-10}` | 1. `POST`.<br>2. Create a matching `Billing` ticket. | `201 Created`, and this rule beats every rule with a non-negative order. `Order` has no `[Range]`, so negative values are a working way to force priority. Harmless but undocumented — record it. | Not Run |
| TC-23-015 | Duplicate rules are permitted | Edge | P2 | A `Billing` rule → agent A, `order: 1` | An identical payload | 1. `POST` the same rule again.<br>2. `GET /api/assignment-rules`. | `201 Created` and two identical rules exist. Unlike SLA rules there is no duplicate guard, so the table accumulates silently conflicting entries. | Not Run |
| TC-23-016 | Rules cannot be edited or deleted | Negative | P2 | A rule pointing at the wrong agent | — | 1. Look for update or delete routes. | There are none. Because duplicates are allowed, the only remedy is to add a competing rule with a lower `Order` and leave the wrong one in place forever. Evidence for GAP-28. | Not Run |
| TC-23-017 | Assignment ignores workload and availability | Edge | P2 | One `Billing` rule → agent A, who already holds 50 open tickets | 10 new `Billing` tickets | 1. Create 10 `Billing` tickets. | All 10 go to agent A. There is no round-robin, no load balancing and no availability check — the "rule" is a static lookup. Confirm against the product intent of story 23. | Not Run |
| TC-23-018 | Re-categorising does not re-run assignment | Edge | P2 | `Billing` → agent A, `Technical` → agent B; a `Billing` ticket assigned to A | `{"category":"Technical"}` | 1. `PATCH /api/tickets/{id}` to `Technical`.<br>2. Re-read `assignedAgentId`. | Still agent A. Automation runs only at creation, so a ticket re-routed to another team's category stays with the original owner — GAP-46. | Not Run |
| TC-23-019 | Auto-assignment notifies nobody | Negative | P2 | A `Billing` rule → agent A | A `Billing` ticket | 1. Create the ticket.<br>2. `GET /api/notifications?userId={A}`. | No notification. An agent is given work with no signal — they must poll their queue. Same root cause as GAP-48. | Not Run |
| TC-23-020 | Assignment and ticket creation commit together | Edge | P2 | A matching rule; force `SaveChangesAsync` to fail | A valid ticket payload | 1. `POST /api/tickets` while the failure is in place.<br>2. Inspect the tickets and events tables. | Neither the ticket nor the assignment event exists. `ApplyOnCreateAsync` stages into the caller's `SaveChangesAsync`, so the ticket and its auto-assignment are atomic. Record as verified. | Not Run |
| TC-23-021 | Unauthorized caller cannot create an assignment rule | Security | P2 | Auth layer deployed | No credentials | 1. `POST /api/assignment-rules` with no `Authorization` header. | `401 Unauthorized`. Until then anyone can route all incoming work to an agent of their choosing. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-23-001, TC-23-002, TC-23-004 | Verified through ticket creation — the story has no endpoint (GAP-07) |
| AC-2 Invalid input → 400 | TC-23-012, TC-23-013 | |
| AC-3 Not found / conflict | TC-23-011, TC-23-015 | Neither the agent nor duplicates are checked |
| AC-4 Authorization → 401/403 | TC-23-021 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-07 | Story 23 has no HTTP surface. It is verified indirectly through ticket creation. |
| GAP-14 | `targetAgentId` is never validated against the users table. |
| GAP-28 | Assignment rules cannot be updated or deleted. |
| GAP-32 | Assignment is a static lookup with no workload, availability or round-robin logic. |
| GAP-46 | Re-categorising a ticket does not re-run assignment. |
| GAP-78 | Duplicate rules are permitted, and two rules of equal specificity and equal `Order` make assignment non-deterministic. |
