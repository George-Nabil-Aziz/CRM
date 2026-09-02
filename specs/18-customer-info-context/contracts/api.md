# API Contract: View customer information in context

## `GET /api/tickets/{id}/context`

### Request

none

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Must be provided and non-empty. |
| `email` | string (email) | Yes | Must be a syntactically valid email address. |
| `phone` | string | Yes | Must be a valid phone number. |
| `recentTickets` | string | Yes | Must be provided and non-empty. |

### Response (success)

ticket plus embedded customer summary

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Invalid query/path parameter |
| 401/403 | Caller lacks permission to view this data |
| 404 | Customer not found |

### Notes

- Compose the ticket-detail response with a joined customer summary rather than a separate round trip.
