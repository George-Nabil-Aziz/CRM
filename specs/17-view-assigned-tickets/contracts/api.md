# API Contract: View assigned tickets

## `GET /api/agents/me/tickets`

### Request

none (optional status/priority filters)

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `subject` | string | Yes | Must be provided and non-empty. |
| `status` | string (enum) | No | Defaults to the resource's initial state if omitted. |
| `priority` | string (enum) | Yes | Must be one of the allowed values for this field. |
| `customerId` | string (UUID) | Yes | Must reference an existing record. |

### Response (success)

list of tickets assigned to the current agent

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Invalid query/path parameter |
| 401/403 | Caller lacks permission to view this data |
| 404 | Ticket not found |

### Notes

- Query tickets by assignedAgentId, defaulting to open/pending statuses.
