# API Contract: Create customer profile

## `POST /api/customers`

### Request

name, email, phone

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `name` | string | Yes | Must be provided and non-empty. |
| `email` | string (email) | Yes | Must be a syntactically valid email address. |
| `phone` | string | Yes | Must be a valid phone number. |
| `createdAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

### Response (success)

customer id, name, email, phone, createdAt

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Missing/invalid field |
| 401/403 | Caller lacks permission |
| 409 | Duplicate Customer |

### Notes

- Add a Customer table and a create-customer endpoint; validate email format server-side.
