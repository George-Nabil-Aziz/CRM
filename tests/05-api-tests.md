# API Tests — CRM

Endpoint-level contract tests: route, verb, status codes, response shape. Behavioural depth
lives in the story folders under [`test-cases/`](test-cases/); this document is the **complete
endpoint inventory** and the contract each one must honour.

**19 controllers, 74 routed endpoints.** Every one is listed below.

## Conventions to assert on every endpoint

| Rule | Expectation |
|---|---|
| Enum serialisation | Strings, never integers — `JsonStringEnumConverter` is global |
| Timestamps | UTC, ISO 8601 |
| Validation failure | `400` with a `ProblemDetails` body naming the field |
| Missing record | `404`, empty body unless a message is documented |
| Malformed GUID in path | `404` from the `{id:guid}` route constraint |
| Empty collection | `200` with `[]` |
| CORS | Only `http://localhost:4200` and `http://localhost:4300` |
| Authentication | **None** — every endpoint below is currently anonymous (GAP-01) |

---

## Customers — `CustomersController`

| ID | Method | Route | Success | Documented failures | Story |
|---|---|---|---|---|---|
| API-CUS-001 | `GET` | `/api/customers?q=` | `200` list, max 200, newest first | — | 01 |
| API-CUS-002 | `GET` | `/api/customers/{id}` | `200` | `404` | 01 |
| API-CUS-003 | `POST` | `/api/customers` | `201` + `Location` | `400`, `409` duplicate email | 01 |
| API-CUS-004 | `PATCH` | `/api/customers/{id}` | `200` | `400`, `404`, `409` | 02 |
| API-CUS-005 | `GET` | `/api/customers/{id}/history` | `200` list, newest first | `404` | 03 |
| API-CUS-006 | `POST` | `/api/customers/{id}/notes` | `201` | `400`, `404` | 04 |

## Tickets — `TicketsController`

| ID | Method | Route | Success | Documented failures | Story |
|---|---|---|---|---|---|
| API-TKT-001 | `GET` | `/api/tickets?status=` | `200` list, max 200, newest first | `400` bad status | 05 |
| API-TKT-002 | `POST` | `/api/tickets` | `201` + `Location` | `400`, **`404`** unknown customer (GAP-03) | 05 |
| API-TKT-003 | `PATCH` | `/api/tickets/{id}` | `200` | `400`, `404` | 06 |
| API-TKT-004 | `POST` | `/api/tickets/{id}/assign` | `200` | `400`, `404` | 07 |
| API-TKT-005 | `PATCH` | `/api/tickets/{id}/status` | `200` | `400` illegal transition **with `allowedTransitions`**, `404` | 08 |
| API-TKT-006 | `POST` | `/api/tickets/{id}/escalate` | `200` | `400`, `404` | 09 |
| API-TKT-007 | `GET` | `/api/tickets/{id}/history` | `200` list, **oldest first** | `404` | 10 |

## Ticket extras — `TicketExtrasController` (base `api/tickets/{id:guid}`)

| ID | Method | Route | Success | Documented failures | Story |
|---|---|---|---|---|---|
| API-TKX-001 | `GET` | `/context` | `200` `{ticket, customer}` | `404` ×2 distinct messages | 18 |
| API-TKX-002 | `GET` | `/messages` | `200` list, oldest first | `404` | 16 |
| API-TKX-003 | `POST` | `/reminders` | `201` | `400`, `404` | 19 |
| API-TKX-004 | `POST` | `/internal-notes` | `201` | `400`, `404` | 21 |

## Channels — `ChannelsController`

All five return **`202 Accepted`**, not `200` or `201`.

| ID | Method | Route | Success | Documented failures | Story |
|---|---|---|---|---|---|
| API-CHN-001 | `POST` | `/api/channels/email/inbound` | `202` | `400` | 11 |
| API-CHN-002 | `POST` | `/api/channels/whatsapp/inbound` | `202` | `400` | 12 |
| API-CHN-003 | `POST` | `/api/channels/sms/inbound` | `202` | `400` | 14 |
| API-CHN-004 | `POST` | `/api/channels/webform` | `202` | `400` | 15 |
| API-CHN-005 | `POST` | `/api/channels/chat/messages` | `202` | `400` | 13 |

## Agents — `AgentsController`

| ID | Method | Route | Success | Documented failures | Story |
|---|---|---|---|---|---|
| API-AGT-001 | `GET` | `/api/agents/me/tickets?agentId=&status=&priority=` | `200` list, urgent first then oldest | `400` missing or bad `agentId` | 17 |

## Quick replies — `QuickRepliesController`

| ID | Method | Route | Success | Documented failures | Story |
|---|---|---|---|---|---|
| API-QRP-001 | `GET` | `/api/quick-replies?category=` | `200` list, **unordered** | — | 20 |
| API-QRP-002 | `POST` | `/api/quick-replies` | `201` | `400` | 20 |

## Notifications — `NotificationsController`

| ID | Method | Route | Success | Documented failures | Story |
|---|---|---|---|---|---|
| API-NOT-001 | `GET` | `/api/notifications?userId=&unreadOnly=` | `200` list, newest first — **raw entity** (GAP-82) | `400` | 25 |
| API-NOT-002 | `POST` | `/api/notifications/{id}/read` | **`204`** | `404` | 25 |

## SLA rules — `SlaRulesController`

| ID | Method | Route | Success | Documented failures | Story |
|---|---|---|---|---|---|
| API-SLA-001 | `POST` | `/api/sla-rules` | `201` | `400`, `409` duplicate pair | 22 |
| API-SLA-002 | `GET` | `/api/sla-rules/{id}` | `200` | `404` | 22 |
| API-SLA-003 | `GET` | `/api/sla-rules` | `200` list | — | 22 |

## Assignment rules — `AssignmentRulesController`

| ID | Method | Route | Success | Documented failures | Story |
|---|---|---|---|---|---|
| API-ASR-001 | `POST` | `/api/assignment-rules` | `201` | `400` | 23 |
| API-ASR-002 | `GET` | `/api/assignment-rules` | `200` list, by `Order` | — | 23 |

## Knowledge base — `ArticlesController`

| ID | Method | Route | Success | Documented failures | Story |
|---|---|---|---|---|---|
| API-KB-001 | `GET` | `/api/kb/faqs?category=` | `200` list, **unordered** | `400` bad category | 26 |
| API-KB-002 | `GET` | `/api/kb/articles/{id}` | `200`, **increments `ViewCount`** | `404` incl. unpublished | 27 |
| API-KB-003 | `GET` | `/api/kb/search?q=` | `200` list | **`400` if `q` absent**; `[]` if blank | 28 |
| API-KB-004 | `POST` | `/api/kb/articles` | `201` + **`Location` that 404s** (GAP-38) | `400` | 29 |
| API-KB-005 | `POST` | `/api/kb/articles/{id}/publish` | `200` | `404` | 29 |

## AI — `AiController` (base `api`)

| ID | Method | Route | Success | Documented failures | Story |
|---|---|---|---|---|---|
| API-AI-001 | `GET` | `/api/tickets/{id}/ai/summary` | `200` | `404` | 30 |
| API-AI-002 | `POST` | `/api/tickets/{id}/ai/suggest-reply` | `200` — **`POST` with no body, mutates nothing** (GAP-94) | `404` | 31 |
| API-AI-003 | `GET` | `/api/tickets/{id}/ai/suggest-solutions` | `200` list, max 3 | `404` | 33 |
| API-AI-004 | `POST` | `/api/chatbot/message` | `200` | `400` | 34 |

## Portal — `PortalController`

| ID | Method | Route | Success | Documented failures | Story |
|---|---|---|---|---|---|
| API-PRT-001 | `POST` | `/api/portal/tickets` | `201` + **`Location` missing `customerId`** (GAP-110) | `400`, `404` | 35 |
| API-PRT-002 | `GET` | `/api/portal/tickets/{id}?customerId=` | `200` | `400`, `404` incl. ownership mismatch | 36 |
| API-PRT-003 | `GET` | `/api/portal/tickets?customerId=&status=` | `200` list, newest first | `400` | 37 |
| API-PRT-004 | `GET` | `/api/portal/kb?q=` | `200` list — **blank `q` returns everything** | — | 38 |
| API-PRT-005 | `POST` | `/api/portal/tickets/{id}/feedback` | `201` | `400` not resolved, `404`, `409` duplicate | 39 |

## Reports — `ReportsController`

| ID | Method | Route | Success | Documented failures | Story |
|---|---|---|---|---|---|
| API-RPT-001 | `GET` | `/api/reports/tickets?groupBy=&dateFrom=&dateTo=` | `200` list | `400` bad date. **Bad `groupBy` is silently ignored** (GAP-120) | 40 |
| API-RPT-002 | `GET` | `/api/reports/sla?dateFrom=&dateTo=` | `200` list | `400` bad date | 41 |
| API-RPT-003 | `GET` | `/api/reports/agents?dateFrom=&dateTo=` | `200` list, by count desc | `400` bad date | 42 |
| API-RPT-004 | `GET` | `/api/reports/csat?dateFrom=&dateTo=` | `200` **object**, not a list | `400` bad date | 43 |
| API-RPT-005 | `GET` | `/api/reports/dashboard?dateFrom=&dateTo=` | `200` composite of the four above | `400` bad date | 44 |

## Users and roles — `UsersController`, `RolesController`

| ID | Method | Route | Success | Documented failures | Story |
|---|---|---|---|---|---|
| API-USR-001 | `POST` | `/api/users` | `201` | `400`, **`404` unknown role**, `409` duplicate email | 45 |
| API-USR-002 | `GET` | `/api/users/{id}` | `200` incl. `roleName` | `404` | 45 |
| API-ROL-001 | `POST` | `/api/roles` | `201` | `400`, `409` duplicate name | 45 |
| API-ROL-002 | `GET` | `/api/roles/{id}` | `200` | `404` | 45 |
| API-ROL-003 | `PATCH` | `/api/roles/{id}/permissions` | `200` — **replaces the whole list** | `400`, `404` | 46 |

## Audit and settings — `AuditLogsController`, `SettingsController`

| ID | Method | Route | Success | Documented failures | Story |
|---|---|---|---|---|---|
| API-AUD-001 | `GET` | `/api/audit-logs?actorId=&targetType=&dateFrom=&dateTo=` | `200` list, newest first, **uncapped** | `400` | 47 |
| API-SET-001 | `PATCH` | `/api/settings` | **`200` even when creating** | `400` | 48 |
| API-SET-002 | `GET` | `/api/settings/{key}` | `200` | `404` | 48 |

## Integrations — `IntegrationsController`

| ID | Method | Route | Success | Documented failures | Story |
|---|---|---|---|---|---|
| API-INT-001 | `POST` | `/api/integrations/apikeys` | `201` — **returns the secret** (GAP-145) | `400` | 49 |
| API-INT-002 | `GET` | `/api/integrations/apikeys/{id}` | `200` — **returns the secret again** | `404` | 49 |
| API-INT-003 | `POST` | `/api/integrations/erp/sync` | **`202`** `{synced:0, failed:0}` | — | 50 |
| API-INT-004 | `GET` | `/api/integrations/erp/sync-logs` | `200` list, max 50 — **raw entity** | — | 50 |
| API-INT-005 | `POST` | `/api/integrations/channels` | `201` — **omits credentials** ✓ | `400` | 51 |
| API-INT-006 | `GET` | `/api/integrations/channels` | `200` list, no credentials ✓ | — | 51 |
| API-INT-007 | `POST` | `/api/integrations/webhooks` | `201` — **omits the secret** (GAP-156) | `400` | 52 |
| API-INT-008 | `GET` | `/api/integrations/webhooks` | `200` list, no secret | — | 52 |

## Platform — `PlatformController` (base `api`)

| ID | Method | Route | Success | Documented failures | Story |
|---|---|---|---|---|---|
| API-PLT-001 | `POST` | `/api/departments` | `201` | `400` | 55 |
| API-PLT-002 | `GET` | `/api/departments` | `200` list, unordered | — | 55 |
| API-PLT-003 | `POST` | `/api/branches` | `201` | `400` | 56 |
| API-PLT-004 | `GET` | `/api/branches` | `200` list, unordered | — | 56 |
| API-PLT-005 | `PATCH` | `/api/settings/branding` | `200` — **contract says `POST`** (GAP-05) | — no validation at all | 57 |
| API-PLT-006 | `GET` | `/api/settings/branding` | `200`, **defaults if unset** | — | 57 |

## Scaffolding

| ID | Method | Route | Note |
|---|---|---|---|
| API-WF-001 | `GET` | `/WeatherForecast` | Leftover Visual Studio scaffold, still routed. Not tested — recommended for deletion (GAP-08). |

---

## Cross-cutting API tests

| ID | Title | Steps | Expected Result | Status |
|---|---|---|---|---|
| API-X-001 | OpenAPI document matches the implementation | 1. In development, `GET /openapi/v1.json`.<br>2. Compare every path and verb with the tables above. | The document lists all 74 endpoints with correct verbs. Any drift — especially `PATCH` versus `POST` on branding — is a defect in the document or the code. | Not Run |
| API-X-002 | Every enum is a string on the wire | 1. Call each endpoint returning an enum.<br>2. Inspect the JSON. | Strings everywhere. One integer is a serialisation defect. | Not Run |
| API-X-003 | Every `Location` header resolves | 1. For each `201`, follow the `Location` header verbatim. | It returns `200`. **Three known failures**: KB article create (GAP-38), portal ticket create and feedback (GAP-110). | Not Run |
| API-X-004 | Verb and content-type errors are correct | 1. Run `NC-X-01` and `NC-X-02` across a sample of endpoints. | `405` and `415` respectively, never `404` or `500`. | Not Run |
| API-X-005 | CORS preflight succeeds for the allowed origins only | 1. `OPTIONS` from `http://localhost:4200`, then from `http://example.com`. | Allowed for the first, rejected for the second. | Not Run |
| API-X-006 | HTTPS redirection is in force | 1. Call an endpoint over plain HTTP. | Redirected — `app.UseHttpsRedirection()` is registered. | Not Run |
| API-X-007 | No endpoint requires authentication | 1. Call all 74 endpoints with no credentials. | All succeed. This documents the current state as a single reproducible finding for GAP-01, and becomes the regression check that auth was applied everywhere once it lands. | Not Run |
