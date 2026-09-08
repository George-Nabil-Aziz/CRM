# Test Cases — 51 Email, SMS and WhatsApp integration

| | |
|---|---|
| **Story** | [`stories/51-email-sms-whatsapp-integration`](../../../stories/51-email-sms-whatsapp-integration/story.md) |
| **Spec** | [`specs/51-email-sms-whatsapp-integration`](../../../specs/51-email-sms-whatsapp-integration/spec.md) |
| **Area** | Integrations |
| **Priority** | P4 |
| **Endpoints** | `POST /api/integrations/channels`, `GET /api/integrations/channels` |
| **Implementation** | [`IntegrationsController.cs`](../../../backend/CrmApi/Controllers/IntegrationsController.cs) |

## Credentials are stored but never used

A `ChannelConfig` is `{ Channel, Credentials, Status }`. `IntegrationChannel` allows only
`Email`, `Sms` and `Whatsapp` — note it excludes `Chat` and `Webform`, which the
`MessageChannel` enum used by ingestion does include.

| | Behaviour |
|---|---|
| Credentials | Stored as a single opaque string, **in plaintext** |
| Validation | `MinLength(1)` only — no provider call, no connectivity check |
| `Status` | Hard-coded to `Active` on creation; `Inactive` and `Error` are never written |
| Response | Deliberately **omits** `Credentials` — the one good security decision in this area |
| Consumers | **None.** No code reads `ChannelConfigs` |

The inbound endpoints in stories 11–15 accept messages regardless of whether a channel is
configured, and no outbound sending exists at all (GAP-18). So this story records intent and
changes nothing.

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-51-001 | Configure an email channel | Positive | P4 | API running | `{"channel":"Email","credentials":"smtp://user:pass@mail.example.com"}` | 1. `POST /api/integrations/channels`. | `201 Created` with a generated `id`, `channel: "Email"` and `status: "Active"`. | Not Run |
| TC-51-002 | Configure SMS and WhatsApp channels | Positive | P4 | API running | One payload per channel | 1. `POST` once per channel.<br>2. `GET /api/integrations/channels`. | Both are created and listed with their own channel values. | Not Run |
| TC-51-003 | The credentials are never returned | Positive | P4 | TC-51-001 has passed | — | 1. Inspect the create response.<br>2. `GET /api/integrations/channels` and inspect the entries. | Neither contains a `credentials` field — `ChannelConfigResponse` carries only `id`, `channel` and `status`. Correct behaviour, and the one place in the product where a secret is deliberately withheld. Record as verified, and contrast with GAP-145 where API keys are returned in full. | Not Run |
| TC-51-004 | An unrecognised channel is rejected | Negative | P4 | API running | `{"channel":"Chat","credentials":"x"}` | 1. `POST`. | `400 Bad Request` — `Chat` is a valid `MessageChannel` but **not** a valid `IntegrationChannel`, so it cannot bind. An easy mistake for a client, since both enums describe channels. | Not Run |
| TC-51-005 | A missing or empty credentials value is rejected | Negative | P4 | API running | `credentials` omitted, then `""` | 1. `POST` once per case. | `400 Bad Request` each time. | Not Run |
| TC-51-006 | A missing channel is rejected | Negative | P4 | API running | `{"credentials":"x"}` | 1. `POST`. | `400 Bad Request` naming `Channel`. | Not Run |
| TC-51-007 | Credentials are never verified | Negative | P4 | API running | `{"channel":"Email","credentials":"complete nonsense"}` | 1. `POST`.<br>2. Read the status. | `201 Created` with `status: "Active"`. No provider call and no format check is made, so a channel with unusable credentials reports itself as healthy. Raise as a defect — GAP-152. | Not Run |
| TC-51-008 | Status is always Active | Negative | P4 | Several channel configs | — | 1. `GET /api/integrations/channels`.<br>2. Inspect every `status`. | `Active` throughout. `ChannelStatus.Inactive` and `ChannelStatus.Error` are declared but no code writes them, and there is no health check to change one. An operator cannot tell a working channel from a broken one — GAP-152. | Not Run |
| TC-51-009 | Duplicate channel configurations are permitted | Edge | P4 | An `Email` config exists | An identical payload | 1. `POST` again.<br>2. `GET /api/integrations/channels`. | Two `Email` entries, both `Active`. There is no uniqueness constraint on channel, so nothing defines which credentials would be used — and since nothing reads them, the ambiguity is currently invisible. Raise before any sending logic is built. | Not Run |
| TC-51-010 | Configurations cannot be updated or deleted | Negative | P4 | An existing config with wrong credentials | — | 1. Look for update or delete routes. | There are none. Rotating a provider password is impossible, and a stale configuration can only be buried under a duplicate. Evidence for GAP-153. | Not Run |
| TC-51-011 | Inbound messages work with no channel configured | Negative | P4 | `SEED-EMPTY` with no channel configs | A valid inbound email payload | 1. `POST /api/channels/email/inbound`. | `202 Accepted` — the message is ingested normally. `ChannelIngestionService` never consults `ChannelConfigs`, so configuration is not a precondition for receiving. **Expected to fail against story 51's intent** — GAP-154. | Not Run |
| TC-51-012 | Nothing can be sent through a configured channel | Negative | P4 | An `Email` channel configured with valid credentials | — | 1. Search the API for an outbound send route. | There is none. Credentials are collected for sending that no code performs — the integration is inbound-only, and inbound does not need them. Follows from GAP-18 and GAP-154. | Not Run |
| TC-51-013 | An empty configuration list | Edge | P4 | `SEED-EMPTY` | — | 1. `GET /api/integrations/channels`. | `200 OK` with `[]`. | Not Run |
| TC-51-014 | Configuration is not audited | Negative | P4 | API running | A valid payload | 1. `POST`.<br>2. `GET /api/audit-logs`. | No entry. Storing provider credentials is a privileged administrative action and leaves no trail — consistent with GAP-138, but more serious here given what is being stored. | Not Run |
| TC-51-015 | Credentials are stored in plaintext | Security | P4 | TC-51-001 has passed | — | 1. Read the `ChannelConfigs` row directly from the database. | The credential string is stored as submitted, unencrypted and unhashed. Withholding it from the API response (TC-51-003) limits exposure through the API but not through a database compromise or a backup. Raise as a security defect — GAP-155. | Not Run |
| TC-51-016 | Anyone can configure a channel | Security | P4 | API running | Any valid payload | 1. `POST /api/integrations/channels` with no credentials. | Currently `201 Created`. An unauthenticated caller can write provider credentials into the system, and — because of GAP-153 — nobody can remove them again. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-51-001, TC-51-002, TC-51-003 | Storage works; nothing consumes it |
| AC-2 Invalid input → 400 | TC-51-004…006 | TC-51-007 shows credentials themselves are unverified |
| AC-3 Not found / conflict | TC-51-009 | Duplicates are permitted |
| AC-4 Authorization → 401/403 | TC-51-016 | Blocked, GAP-01 |
| Story intent — channels are driven by this config | TC-51-011, TC-51-012 | Expected to fail — GAP-154 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-152 | Credentials are never verified and `Status` is hard-coded to `Active`, so a broken channel reports itself as healthy. |
| GAP-153 | Channel configurations cannot be updated or deleted, so credentials can never be rotated. |
| GAP-154 | Nothing reads `ChannelConfigs`. Inbound ingestion works without any configuration and no outbound sending exists, so the stored credentials serve no purpose. |
| GAP-155 | Provider credentials are stored in plaintext. |
