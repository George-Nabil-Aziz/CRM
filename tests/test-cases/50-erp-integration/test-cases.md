# Test Cases — 50 ERP integration

| | |
|---|---|
| **Story** | [`stories/50-erp-integration`](../../../stories/50-erp-integration/story.md) |
| **Spec** | [`specs/50-erp-integration`](../../../specs/50-erp-integration/spec.md) |
| **Area** | Integrations |
| **Priority** | P4 |
| **Endpoints** | `POST /api/integrations/erp/sync`, `GET /api/integrations/erp/sync-logs` |
| **Implementation** | [`IntegrationsController.cs`](../../../backend/CrmApi/Controllers/IntegrationsController.cs) |

## The sync is an acknowledged no-op

The controller says so in its own comment: no ERP endpoint is configured in this environment, so
the action writes one log row and returns. Every run:

- Writes an `ErpSyncLog` with `EntityType: Customer`, `ExternalId: "n/a"`, `Status: Success`.
- Returns `202 Accepted` with `{ synced: 0, failed: 0, completedAt }`.
- Reads nothing, writes no customer or order, and calls nothing external.

The mechanism — trigger, log, report — is real and testable. The integration is not. There is
also no scheduled job despite the comment referring to one, and no configuration for an ERP
endpoint or its credentials anywhere in the API.

The `SyncStatus` enum declares `Failed` and `InProgress`; neither is ever written.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-50-001 | Trigger a sync run | Positive | P4 | API running | No body | 1. `POST /api/integrations/erp/sync`. | **`202 Accepted`** — not `200` or `201` — with `{synced: 0, failed: 0, completedAt}` where `completedAt` is a UTC timestamp. | Not Run |
| TC-50-002 | Each run writes exactly one log entry | Positive | P4 | `SEED-EMPTY` | — | 1. `POST` the sync three times.<br>2. `GET /api/integrations/erp/sync-logs`. | Three entries, one per run. | Not Run |
| TC-50-003 | The log entry records the run outcome | Positive | P4 | TC-50-001 has passed | — | 1. `GET /api/integrations/erp/sync-logs`.<br>2. Inspect the newest entry. | `entityType: "Customer"`, `externalId: "n/a"`, `status: "Success"`, and a `syncedAt` matching the `completedAt` returned by the trigger. | Not Run |
| TC-50-004 | Logs are newest first | Positive | P4 | Three runs at distinct times | — | 1. `GET /api/integrations/erp/sync-logs`. | Ordered by `syncedAt` descending. | Not Run |
| TC-50-005 | Logs are capped at 50 | Edge | P4 | 55 sync runs | — | 1. `POST` the sync 55 times.<br>2. `GET /api/integrations/erp/sync-logs`.<br>3. Count the results. | Exactly 50 — the newest. The 5 oldest are unreachable through the API with no paging and no date filter, unlike the audit log which is uncapped. Record the inconsistency. | Not Run |
| TC-50-006 | An empty log returns an empty list | Edge | P4 | `SEED-EMPTY`, no runs performed | — | 1. `GET /api/integrations/erp/sync-logs`. | `200 OK` with `[]`. | Not Run |
| TC-50-007 | The run always reports success | Negative | P4 | API running | — | 1. `POST` the sync several times.<br>2. Inspect every `status`. | `Success` every time. `SyncStatus.Failed` and `SyncStatus.InProgress` are declared but no code path writes either, so the log can never record a problem and a monitoring dashboard built on it would show a permanently green integration. Raise as a defect — GAP-148. | Not Run |
| TC-50-008 | Nothing is actually synchronised | Negative | P4 | Customers and tickets exist | — | 1. Record the customer and order data.<br>2. `POST` the sync.<br>3. Re-read everything. | Nothing changed, and `synced: 0`. No external call is made, no record is created, updated or matched. **Expected to fail against story 50's intent** — the endpoint exercises the mechanism, not the integration. Evidence for GAP-149. | Not Run |
| TC-50-009 | There is no ERP configuration | Negative | P4 | API running | — | 1. Search the API for a route configuring an ERP endpoint, credentials or field mapping. | There is none. `POST /api/integrations/channels` covers messaging channels only. Even if the sync logic existed it would have nowhere to connect. Follows from GAP-149. | Not Run |
| TC-50-010 | There is no scheduled sync | Negative | P4 | API running | — | 1. Inspect `Program.cs` for hosted services.<br>2. Wait 10 minutes without triggering the endpoint.<br>3. `GET /api/integrations/erp/sync-logs`. | Only `SlaMonitorService` is registered as a `BackgroundService`. No new log entries appear, so the "equivalent scheduled job" the controller comment refers to does not exist — sync happens only when someone calls the endpoint. Raise as a defect — GAP-150. | Not Run |
| TC-50-011 | Concurrent triggers each write a log | Edge | P4 | API running | — | 1. Issue 5 simultaneous `POST` requests.<br>2. Count the log entries. | Five entries. There is no run lock or in-progress guard, so overlapping syncs are possible — harmless while the run is a no-op, but it must be addressed before real sync logic is added. | Not Run |
| TC-50-012 | The endpoint returns the raw entity | Edge | P4 | Sync logs exist | — | 1. `GET /api/integrations/erp/sync-logs`.<br>2. Inspect the JSON shape. | `ErpSyncLog` model objects are returned directly rather than a DTO — the same design defect as the notifications endpoint (GAP-82). Any column added to the entity is exposed automatically. | Not Run |
| TC-50-013 | Sync activity is not audited | Negative | P4 | API running | — | 1. `POST` the sync.<br>2. `GET /api/audit-logs`. | No entry. Triggering an integration run is an administrative action and leaves no audit trail — consistent with GAP-138. | Not Run |
| TC-50-014 | Anyone can trigger a sync | Security | P4 | API running | No body | 1. `POST /api/integrations/erp/sync` with no credentials, 1,000 times. | All succeed, each writing a log row. Inert today, but an unauthenticated trigger on an integration endpoint is both a load vector and, once real sync logic lands, a way to drive traffic against a partner system. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-50-001, TC-50-003, TC-50-004 | The mechanism only — see TC-50-008 |
| AC-2 Invalid input → 400 | — | The trigger takes no input |
| AC-3 Not found / conflict | TC-50-006, TC-50-011 | No in-progress guard |
| AC-4 Authorization → 401/403 | TC-50-014 | Blocked, GAP-01 |
| Story intent — data is synchronised | TC-50-008 | Expected to fail — GAP-149 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-82 | The sync-log endpoint returns raw entity objects instead of a DTO. |
| GAP-148 | Every run is logged as `Success`. `Failed` and `InProgress` are declared but never written, so the log cannot surface a problem. |
| GAP-149 | No ERP call is made and no configuration exists for one. The endpoint exercises the logging mechanism, not the integration. |
| GAP-150 | There is no scheduled sync job, despite the code comment referring to one. |
| GAP-151 | Sync-log history is capped at 50 with no paging or date filter. |
