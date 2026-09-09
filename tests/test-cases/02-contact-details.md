# Test Cases — 02 Manage contact details

| | |
|---|---|
| **Story** | [`stories/02-contact-details`](../../../stories/02-contact-details/story.md) |
| **Spec** | [`specs/02-contact-details`](../../../specs/02-contact-details/spec.md) |
| **Area** | Customer Management |
| **Priority** | P1 |
| **Endpoints** | `PATCH /api/customers/{id}` |
| **Implementation** | [`CustomersController.cs`](../../../backend/CrmApi/Controllers/CustomersController.cs) |
| **UI** | [`customer-detail.page.ts`](../../../frontend/src/app/pages/customer-detail.page.ts) |

## How the update is applied

All three fields are optional, and each is treated differently. These asymmetries drive
most of the cases below.

| Field | Applied when | Skipped when |
|---|---|---|
| `email` | Non-blank **and** different from the stored value; uniqueness is re-checked, excluding this customer | Null, blank, or unchanged |
| `phone` | Non-blank | Null or whitespace-only |
| `address` | Not null — an empty string **is** applied | Null only |

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-02-001 | Update phone, email and address together | Positive | P1 | An existing customer | `{"phone":"+201111111111","email":"layla.new@example.com","address":"12 Nile St, Cairo"}` | 1. `PATCH /api/customers/{id}`.<br>2. `GET /api/customers/{id}`. | `200 OK`. All three values are updated and persist across the follow-up read. | Not Run |
| TC-02-002 | Partial update leaves other fields untouched | Positive | P1 | A customer with all fields populated | `{"phone":"+201222222222"}` | 1. Record the current `email` and `address`.<br>2. `PATCH` with `phone` only.<br>3. Read the customer back. | `200 OK`. `phone` changed; `email` and `address` hold their previous values. | Not Run |
| TC-02-003 | Email collision with another customer is rejected | Negative | P1 | Two customers, A and B | A's payload carrying B's email | 1. `PATCH /api/customers/{A}` with B's email. | `409 Conflict`. A's email is unchanged. | Not Run |
| TC-02-004 | Re-submitting the customer's own email succeeds | Edge | P2 | An existing customer | The customer's current email | 1. `PATCH /api/customers/{id}` with the value already stored. | `200 OK`, no conflict — the equality check short-circuits before the uniqueness query runs. | Not Run |
| TC-02-005 | Update a customer that does not exist | Negative | P1 | API running | A random UUID | 1. `PATCH /api/customers/{random-uuid}`. | `404 Not Found`. | Not Run |
| TC-02-006 | Whitespace-only phone is ignored | Edge | P2 | A customer with a phone on file | `{"phone":"   "}` | 1. `PATCH` with a whitespace-only `phone`.<br>2. Read the customer back. | `200 OK` and the original phone is retained — the guard is `IsNullOrWhiteSpace`. | Not Run |
| TC-02-007 | Address can be cleared to an empty string | Edge | P2 | A customer with an address | `{"address":""}` | 1. `PATCH` with an empty `address`.<br>2. Read the customer back. | `200 OK` and `address` is now `""`. Unlike phone and email, an empty address is applied because the check is `is not null`, not `IsNullOrWhiteSpace`. Confirm this asymmetry is intended. | Not Run |
| TC-02-008 | Malformed email is rejected before any write | Negative | P1 | An existing customer | `{"email":"not-an-email"}` | 1. `PATCH` with the malformed address. | `400 Bad Request` naming `Email`. Nothing is persisted, including any valid fields sent alongside it. | Not Run |
| TC-02-009 | An empty body is accepted as a no-op | Edge | P2 | An existing customer | `{}` | 1. `PATCH /api/customers/{id}` with an empty object. | `200 OK` and the customer is unchanged. | Not Run |
| TC-02-010 | The phone number format is never validated | Negative | P2 | An existing customer | `{"phone":"not a phone number"}` | 1. `PATCH /api/customers/{id}`. | `200 OK` and the text is stored verbatim. `Phone` carries no `[Phone]` attribute at create or update time, so any string is accepted. Raise as a defect — it also feeds the exact-match phone lookup used by SMS and WhatsApp ingestion. | Not Run |
| TC-02-011 | Contact changes are not audited | Negative | P2 | An existing customer | Any valid update | 1. `PATCH /api/customers/{id}`.<br>2. `GET /api/audit-logs`. | No entry is written. Article creation and role changes are audited but customer contact edits are not, so there is no record of who changed a customer's email. Evidence for GAP-41. | Not Run |
| TC-02-012 | Unauthorized caller cannot update contact details | Security | P1 | Auth layer deployed | No credentials | 1. `PATCH /api/customers/{id}` with no `Authorization` header. | `401 Unauthorized` and no change is persisted. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-02-001, TC-02-002 | |
| AC-2 Invalid input → 400 | TC-02-008 | |
| AC-3 Not found / conflict | TC-02-003, TC-02-005 | |
| AC-4 Authorization → 401/403 | TC-02-012 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-41 | Customer contact changes are not written to the audit log, so email and phone edits are untraceable. |
| GAP-42 | `Phone` is never format-validated on create or update, yet exact string matching on it drives SMS and WhatsApp customer lookup. |
