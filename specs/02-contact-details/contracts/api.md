# API Contract: Manage contact details

## `PATCH /api/customers/{id}`

### Request

any subset of phone, email, address

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `phone` | string | Yes | Must be a valid phone number. |
| `email` | string (email) | Yes | Must be a syntactically valid email address. |
| `address` | string | Yes | Must be provided and non-empty. |

### Response (success)

updated customer object

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Invalid field value |
| 401/403 | Caller lacks permission to modify this Customer |
| 404 | Customer not found |

### Notes

- Extend the customer-update endpoint to accept partial contact fields and re-validate them.
