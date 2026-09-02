# API Contract: View ticket history

## `GET /api/tickets/{id}/history`

### Request

none

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `type` | string (enum) | Yes | Must be one of the allowed values for this field. |
| `actorId` | string (UUID) | Yes | Must reference an existing record. |
| `timestamp` | string | Yes | Must be provided and non-empty. |
| `details` | string | Yes | Must be provided and non-empty. |

### Response (success)

list of ticket events ordered by timestamp

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Invalid query/path parameter |
| 401/403 | Caller lacks permission to view this data |
| 404 | TicketEvent not found |

### Notes

- Write a TicketEvent row on every mutating action (status change, assignment, message, escalation).
