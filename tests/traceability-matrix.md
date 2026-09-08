# Traceability Matrix — CRM

Every specification maps to a test-case file; every file maps back to its spec and story. Use
this to answer two questions: *is story N covered?* and *if endpoint X changes, what do I run?*

**Legend** — Cases: total in that story's file. Blocked: cases waiting on GAP-01.
Findings: gaps first raised by that story.

---

## Coverage by story

| # | Story | Area | Pri | Endpoint(s) | Cases | Blocked | Findings |
|---|---|---|---|---|---|---|---|
| [01](test-cases/01-customer-profile/test-cases.md) | Create customer profile | Customer Mgmt | P1 | `POST/GET /api/customers` | 14 | 1 | GAP-40 |
| [02](test-cases/02-contact-details/test-cases.md) | Manage contact details | Customer Mgmt | P1 | `PATCH /api/customers/{id}` | 12 | 1 | GAP-41, 42 |
| [03](test-cases/03-interaction-history/test-cases.md) | View interaction history | Customer Mgmt | P1 | `GET /api/customers/{id}/history` | 9 | 1 | GAP-43, 44 |
| [04](test-cases/04-notes-attachments/test-cases.md) | Add notes and attachments | Customer Mgmt | P1 | `POST /api/customers/{id}/notes` | 12 | 1 | GAP-10, 11, 12, 45 |
| [05](test-cases/05-create-track-tickets/test-cases.md) | Create and track tickets | Ticket Mgmt | P1 | `POST/GET /api/tickets` | 16 | 1 | GAP-02, 03, 04, 16 |
| [06](test-cases/06-categories-priorities/test-cases.md) | Categories and priorities | Ticket Mgmt | P1 | `PATCH /api/tickets/{id}` | 14 | 1 | GAP-15, 31, 46 |
| [07](test-cases/07-assign-tickets/test-cases.md) | Assign tickets | Ticket Mgmt | P1 | `POST .../assign` | 13 | 1 | GAP-14, 47, 48, 49 |
| [08](test-cases/08-update-ticket-status/test-cases.md) | Update status | Ticket Mgmt | P1 | `PATCH .../status` | 20 | 1 | GAP-50, 51 |
| [09](test-cases/09-escalate-tickets/test-cases.md) | Escalate tickets | Ticket Mgmt | P1 | `POST .../escalate` | 14 | 1 | GAP-33, 52, 53, 54, 55 |
| [10](test-cases/10-ticket-history/test-cases.md) | View ticket history | Ticket Mgmt | P1 | `GET .../history` | 15 | 1 | GAP-13, 15, 17, 56, 57 |
| [11](test-cases/11-contact-email/test-cases.md) | Contact via email | Channels | P2 | `POST /api/channels/email/inbound` | 15 | 1 | GAP-22, 58, 59 |
| [12](test-cases/12-contact-whatsapp/test-cases.md) | Contact via WhatsApp | Channels | P2 | `POST .../whatsapp/inbound` | 13 | 1 | GAP-19, 60 |
| [13](test-cases/13-contact-live-chat/test-cases.md) | Contact via live chat | Channels | P2 | `POST .../chat/messages` | 11 | 1 | GAP-06, 18, 20, 61 |
| [14](test-cases/14-contact-sms/test-cases.md) | Contact via SMS | Channels | P2 | `POST .../sms/inbound` | 14 | 1 | GAP-62 |
| [15](test-cases/15-submit-web-form/test-cases.md) | Submit via web form | Channels | P2 | `POST .../webform` | 12 | 1 | GAP-21, 63, 64 |
| [16](test-cases/16-unified-multichannel-thread/test-cases.md) | Unified thread | Channels | P2 | `GET /api/tickets/{id}/messages` | 14 | 1 | GAP-65, 66 |
| [17](test-cases/17-view-assigned-tickets/test-cases.md) | View assigned tickets | Agent Dash | P2 | `GET /api/agents/me/tickets` | 13 | 1 | GAP-23, 67, 68 |
| [18](test-cases/18-customer-info-context/test-cases.md) | Customer info in context | Agent Dash | P2 | `GET /api/tickets/{id}/context` | 10 | 1 | GAP-24 |
| [19](test-cases/19-tasks-reminders/test-cases.md) | Tasks and reminders | Agent Dash | P2 | `POST .../reminders` | 14 | 1 | GAP-25 |
| [20](test-cases/20-quick-replies/test-cases.md) | Quick replies | Agent Dash | P2 | `GET/POST /api/quick-replies` | 16 | 1 | GAP-27, 69, 70, 71 |
| [21](test-cases/21-team-collaboration/test-cases.md) | Team collaboration | Agent Dash | P2 | `POST .../internal-notes` | 17 | 1 | GAP-26, 72, 73, 74 |
| [22](test-cases/22-sla-targets/test-cases.md) | Response/resolution targets | SLA | P2 | `POST/GET /api/sla-rules` | 20 | 1 | GAP-28, 29, 75, 76, 77 |
| [23](test-cases/23-automatic-assignment/test-cases.md) | Automatic assignment | SLA | P2 | *(event)* + `/api/assignment-rules` | 21 | 1 | GAP-07, 32, 78 |
| [24](test-cases/24-escalation-rules/test-cases.md) | Escalation rules | SLA | P2 | *(scheduled job)* | 16 | 0 | GAP-09, 30, 79, 80 |
| [25](test-cases/25-alerts-notifications/test-cases.md) | Alerts and notifications | SLA | P2 | `GET /api/notifications` | 20 | 1 | GAP-81, 82, 83 |
| [26](test-cases/26-browse-faqs/test-cases.md) | Browse FAQs | KB | P3 | `GET /api/kb/faqs` | 12 | 0 | GAP-39, 84 |
| [27](test-cases/27-help-articles-guides/test-cases.md) | Read articles and guides | KB | P3 | `GET /api/kb/articles/{id}` | 13 | 0 | GAP-34, 85 |
| [28](test-cases/28-search-knowledge-base/test-cases.md) | Search knowledge base | KB | P3 | `GET /api/kb/search` | 17 | 0 | GAP-86, 87, 88 |
| [29](test-cases/29-manage-kb-content/test-cases.md) | Manage KB content | KB | P3 | `POST /api/kb/articles` | 21 | 1 | GAP-35, 36, 37, 38, 89 |
| [30](test-cases/30-ai-ticket-summaries/test-cases.md) | AI ticket summaries | AI | P3 | `GET .../ai/summary` | 15 | 1 | GAP-90, 91 |
| [31](test-cases/31-ai-suggested-replies/test-cases.md) | AI suggested replies | AI | P3 | `POST .../ai/suggest-reply` | 15 | 1 | GAP-92, 93, 94 |
| [32](test-cases/32-automatic-categorization/test-cases.md) | Automatic categorization | AI | P3 | *(event)* | 18 | 0 | GAP-95, 96, 97, 98, 99 |
| [33](test-cases/33-ai-suggested-solutions/test-cases.md) | AI suggested solutions | AI | P3 | `GET .../ai/suggest-solutions` | 18 | 1 | GAP-100…104 |
| [34](test-cases/34-ai-chatbot/test-cases.md) | AI chatbot | AI | P3 | `POST /api/chatbot/message` | 20 | 1 | GAP-105, 106, 107, 108 |
| [35](test-cases/35-submit-tickets-portal/test-cases.md) | Submit via portal | Portal | P3 | `POST /api/portal/tickets` | 14 | 2 | GAP-109, 110 |
| [36](test-cases/36-track-requests/test-cases.md) | Track requests | Portal | P3 | `GET /api/portal/tickets/{id}` | 12 | 1 | GAP-111, 112 |
| [37](test-cases/37-view-history-portal/test-cases.md) | View history | Portal | P3 | `GET /api/portal/tickets` | 13 | 1 | GAP-113 |
| [38](test-cases/38-access-faqs-portal/test-cases.md) | Access FAQs | Portal | P3 | `GET /api/portal/kb` | 15 | 0 | GAP-114, 115 |
| [39](test-cases/39-submit-feedback/test-cases.md) | Submit feedback | Portal | P3 | `POST .../feedback` | 21 | 1 | GAP-116…119 |
| [40](test-cases/40-ticket-reports/test-cases.md) | Ticket reports | Reports | P3 | `GET /api/reports/tickets` | 17 | 1 | GAP-120, 121, 122 |
| [41](test-cases/41-sla-performance-reports/test-cases.md) | SLA performance | Reports | P3 | `GET /api/reports/sla` | 18 | 1 | GAP-123, 124 |
| [42](test-cases/42-agent-performance-reports/test-cases.md) | Agent performance | Reports | P3 | `GET /api/reports/agents` | 18 | 1 | GAP-125, 126, 127 |
| [43](test-cases/43-customer-satisfaction-reports/test-cases.md) | CSAT reports | Reports | P3 | `GET /api/reports/csat` | 16 | 1 | GAP-128, 129 |
| [44](test-cases/44-management-dashboards/test-cases.md) | Management dashboards | Reports | P3 | `GET /api/reports/dashboard` | 15 | 1 | GAP-130, 131 |
| [45](test-cases/45-manage-users-roles/test-cases.md) | Manage users and roles | Security | P2 | `POST /api/users`, `/api/roles` | 17 | 1 | GAP-132, 133 |
| [46](test-cases/46-configure-permissions/test-cases.md) | Configure permissions | Security | P2 | `PATCH /api/roles/{id}/permissions` | 12 | 1 | GAP-134, 135, 136 |
| [47](test-cases/47-audit-logs/test-cases.md) | Audit logs | Security | P2 | `GET /api/audit-logs` | 18 | 1 | GAP-137…140 |
| [48](test-cases/48-system-configuration/test-cases.md) | System configuration | Security | P2 | `PATCH /api/settings` | 16 | 1 | GAP-141…144 |
| [49](test-cases/49-apis/test-cases.md) | APIs | Integrations | P4 | `/api/integrations/apikeys` | 15 | 1 | GAP-145, 146, 147 |
| [50](test-cases/50-erp-integration/test-cases.md) | ERP integration | Integrations | P4 | `/api/integrations/erp/*` | 14 | 1 | GAP-148…151 |
| [51](test-cases/51-email-sms-whatsapp-integration/test-cases.md) | Channel integration | Integrations | P4 | `/api/integrations/channels` | 16 | 1 | GAP-152…155 |
| [52](test-cases/52-external-systems/test-cases.md) | External systems | Integrations | P4 | `/api/integrations/webhooks` | 19 | 1 | GAP-156…160 |
| [53](test-cases/53-arabic-english/test-cases.md) | Arabic and English | Platform | P4 | *(cross-cutting)* | 18 | 0 | GAP-161 |
| [54](test-cases/54-web-mobile-friendly/test-cases.md) | Web and mobile friendly | Platform | P4 | *(front end)* | 18 | 0 | GAP-162 |
| [55](test-cases/55-multi-department/test-cases.md) | Multi-department | Platform | P4 | `/api/departments` | 14 | 1 | GAP-163, 164 |
| [56](test-cases/56-multi-branch/test-cases.md) | Multi-branch | Platform | P4 | `/api/branches` | 16 | 1 | GAP-165, 166 |
| [57](test-cases/57-custom-branding/test-cases.md) | Custom branding | Platform | P4 | `PATCH /api/settings/branding` | 15 | 1 | GAP-05, 167, 168, 169 |

**All 57 stories are covered. No specification is without a test-case file.**

---

## Endpoint → story reverse index

Use this when changing a controller: it names the story file to open.

| Controller | Stories |
|---|---|
| `CustomersController` | 01, 02, 03, 04 |
| `TicketsController` | 05, 06, 07, 08, 09, 10 |
| `TicketExtrasController` | 16, 18, 19, 21 |
| `ChannelsController` | 11, 12, 13, 14, 15 |
| `AgentsController` | 17 |
| `QuickRepliesController` | 20 |
| `NotificationsController` | 21, 25 |
| `SlaRulesController` | 22 |
| `AssignmentRulesController` | 23 |
| `ArticlesController` | 26, 27, 28, 29 |
| `AiController` | 30, 31, 33, 34 |
| `PortalController` | 35, 36, 37, 38, 39 |
| `ReportsController` | 40, 41, 42, 43, 44 |
| `UsersController` / `RolesController` | 45, 46 |
| `AuditLogsController` | 47 |
| `SettingsController` | 48 |
| `IntegrationsController` | 49, 50, 51, 52 |
| `PlatformController` | 55, 56, 57 |
| `WeatherForecastController` | *(none — scaffolding, GAP-08)* |

## Service → story reverse index

Services have no endpoints of their own, so a change here has wide reach.

| Service | Stories affected |
|---|---|
| `TicketAutomationService` | 05, 22, 23, 35, plus every channel story 11–15 |
| `ChannelIngestionService` | 11, 12, 13, 14, 15, 16, 32 |
| `SlaMonitorService` | 24, 25, 41 |
| `AiService` | 30, 31, 32, 33, 34, plus ingestion via `Categorize` |
| `WebhookDispatcher` | 05, 08, 09, 24, 35, 52 |
| `AuditLogger` | 29, 45, 46, 47, 48 |

## Stories with no HTTP endpoint

Verified indirectly. See GAP-07.

| Story | Verified through |
|---|---|
| 23 Automatic assignment | Ticket creation, plus `/api/assignment-rules` |
| 24 Escalation rules | `SlaMonitorService.RunOnceAsync` and its database effects |
| 25 Alerts and notifications | The monitor's writes, read via `/api/notifications` |
| 32 Automatic categorization | Channel ingestion, read via the created ticket's category |
| 53 Arabic and English | Round-tripping content through every layer |
| 54 Web and mobile friendly | The Angular pages at three viewport widths |

## Cross-cutting documents

| Document | Case prefix | Own cases |
|---|---|---|
| [`03-edge-cases.md`](03-edge-cases.md) | `EC-X-` | 8, plus a thematic index of all 294 edge cases |
| [`04-negative-cases.md`](04-negative-cases.md) | `NC-X-` | 8, plus a thematic index of all 277 negative cases |
| [`05-api-tests.md`](05-api-tests.md) | `API-` | 74 endpoint contracts + 7 cross-cutting |
| [`06-ui-tests.md`](06-ui-tests.md) | `UI-` | 61 across 6 pages |
| [`07-integration-tests.md`](07-integration-tests.md) | `INT-` | 30 multi-service chains |
| [`08-regression-suite.md`](08-regression-suite.md) | `REG-` | Selections only — no new cases |
