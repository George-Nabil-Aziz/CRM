# API Contract: View interaction history

## `GET /api/customers/{id}/history`

### Request

none (path param: customer id)

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `customerId` | string (UUID) | Yes | Must reference an existing record. |
| `type` | string (enum) | Yes | Must be one of the allowed values for this field. |
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `timestamp` | string | Yes | Must be provided and non-empty. |

### Response (success)

list of interaction entries ordered by timestamp desc

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Invalid query/path parameter |
| 401/403 | Caller lacks permission to view this data |
| 404 | Interaction not found |

### Notes

- Aggregate ticket events, messages, and notes into one timeline query keyed by customer id.
