# API Contract: Track requests

## `GET /api/portal/tickets/{id}`

### Request

none

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `subject` | string | Yes | Must be provided and non-empty. |
| `status` | string (enum) | No | Defaults to the resource's initial state if omitted. |
| `lastUpdatedAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

### Response (success)

ticket status detail

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Invalid query/path parameter |
| 401/403 | Caller lacks permission to view this data |
| 404 | Ticket not found |

### Notes

- Same ticket-read endpoint agents use, restricted to tickets owned by the logged-in customer.
