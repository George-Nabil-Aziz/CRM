# API Contract: Submit tickets via portal

## `POST /api/portal/tickets`

### Request

subject, category, description

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `same fields as core ticket creation` | string | Yes | Must be provided and non-empty. |
| `scoped to the authenticated customer` | string | Yes | Must be provided and non-empty. |

### Response (success)

created ticket visible in the customer's portal history

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Missing/invalid field |
| 401/403 | Caller lacks permission |
| 409 | Duplicate Ticket |

### Notes

- Reuse the core ticket-creation logic, scoped to the logged-in customer's id.
