# Test Cases — 01 Create customer profile

| | |
|---|---|
| **Story** | [`stories/01-customer-profile`](../../../stories/01-customer-profile/story.md) |
| **Spec** | [`specs/01-customer-profile`](../../../specs/01-customer-profile/spec.md) |
| **Area** | Customer Management |
| **Priority** | P1 |
| **Endpoints** | `POST /api/customers`, `GET /api/customers?q=`, `GET /api/customers/{id}` |
| **Implementation** | [`CustomersController.cs`](../../../backend/CrmApi/Controllers/CustomersController.cs), [`CustomerDtos.cs`](../../../backend/CrmApi/Dtos/CustomerDtos.cs) |
| **UI** | [`customers.page.ts`](../../../frontend/src/app/pages/customers.page.ts) |

## Validation rules in force

| Field | Rule |
|---|---|
| `name` | `[Required, MinLength(1)]` |
| `email` | `[Required, EmailAddress]`, and unique across all customers |
| `phone` | `[Required, MinLength(1)]` |

---

## Test cases

| ID | Title | Type | Pri | Preconditions | Test Data | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|---|---|
| TC-01-001 | Create a customer with valid details | Positive | P1 | `SEED-EMPTY`; API running | `{"name":"Layla Hassan","email":"layla.hassan@example.com","phone":"+201000000001"}` | 1. `POST /api/customers` with the test data.<br>2. Read the response body and headers. | `201 Created`. Body contains a generated `id` (UUID), the submitted `name`, `email` and `phone`, `address: null`, and a UTC `createdAt`. A `Location` header points at the customer's history route. | Not Run |
| TC-01-002 | Duplicate email is rejected | Negative | P1 | `layla.hassan@example.com` already exists | The same payload as TC-01-001 | 1. `POST /api/customers` with an email already on file. | `409 Conflict` with the message `A customer with this email already exists.` No second record is created. | Not Run |
| TC-01-003 | Empty name is rejected | Negative | P1 | API running | `{"name":"","email":"a@b.com","phone":"+20100"}` | 1. `POST /api/customers`. | `400 Bad Request`. `ProblemDetails.errors` names `Name`. Nothing is persisted. | Not Run |
| TC-01-004 | Empty phone is rejected | Negative | P1 | API running | `{"name":"Layla","email":"a@b.com","phone":""}` | 1. `POST /api/customers`. | `400 Bad Request` naming `Phone`. | Not Run |
| TC-01-005 | Malformed email is rejected | Negative | P1 | API running | `{"name":"Layla","email":"not-an-email","phone":"+20100"}` | 1. `POST /api/customers`. | `400 Bad Request` naming `Email`. | Not Run |
| TC-01-006 | Omitted field is rejected | Negative | P1 | API running | `{"name":"Layla","phone":"+20100"}` | 1. `POST /api/customers` with `email` absent. | `400 Bad Request` naming `Email`. | Not Run |
| TC-01-007 | A new customer appears in the list immediately | Positive | P1 | TC-01-001 has passed | — | 1. `GET /api/customers`.<br>2. Locate the new customer. | `200 OK`. The customer is present and, being the most recent, is first — the list is ordered by `createdAt` descending. | Not Run |
| TC-01-008 | Search matches on name | Positive | P1 | `SEED-BASE` | `?q=layla` | 1. `GET /api/customers?q=layla`. | `200 OK`. Every result's `name` or `email` contains `layla`. The match is a substring, not a prefix. | Not Run |
| TC-01-009 | Search matches on email | Positive | P1 | `SEED-BASE` | `?q=example.com` | 1. `GET /api/customers?q=example.com`. | `200 OK` with every customer on that domain. | Not Run |
| TC-01-010 | Fetch a single customer by id | Positive | P1 | `SEED-BASE` | A known customer id | 1. `GET /api/customers/{id}`. | `200 OK` with the full customer record. | Not Run |
| TC-01-011 | Fetch a customer that does not exist | Negative | P1 | API running | A random UUID | 1. `GET /api/customers/{random-uuid}`. | `404 Not Found` with an empty body. | Not Run |
| TC-01-012 | The customer list is capped at 200 | Edge | P2 | 205 customers exist | — | 1. `GET /api/customers`.<br>2. Count the results. | Exactly 200 are returned, newest first, with no pagination cursor. The 5 oldest are unreachable through the API. Raise as a defect. | Not Run |
| TC-01-013 | Email uniqueness is case-sensitive | Edge | P2 | `layla.hassan@example.com` exists | `{"name":"L","email":"LAYLA.HASSAN@example.com","phone":"+20100"}` | 1. `POST /api/customers` with the address in different casing. | Verify the outcome against the database collation. Under a case-insensitive collation this returns `409`; under a case-sensitive one a duplicate person is created. Record the actual behaviour — it must be deterministic. | Not Run |
| TC-01-014 | Unauthenticated caller cannot create a customer | Security | P1 | Auth layer deployed | No credentials | 1. `POST /api/customers` with no `Authorization` header. | `401 Unauthorized` and no record created. | **Blocked** — GAP-01 |

---

## Acceptance criteria coverage

| Spec AC | Covered by | Note |
|---|---|---|
| AC-1 Happy path | TC-01-001, TC-01-007 | |
| AC-2 Invalid input → 400 | TC-01-003…006 | |
| AC-3 Duplicate → 409 | TC-01-002 | |
| AC-4 Authorization → 401/403 | TC-01-014 | Blocked, GAP-01 |

## Findings raised by this story

| ID | Finding |
|---|---|
| GAP-40 | `GET /api/customers` caps results at 200 with no pagination. |
