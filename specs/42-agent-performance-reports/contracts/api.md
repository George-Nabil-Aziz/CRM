# API Contract: Agent performance reports

## `GET /api/reports/agents`

### Request

dateFrom, dateTo

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `assignedAgentId` | string (UUID) | Yes | Must reference an existing record. |
| `resolutionTime` | string | Yes | Must be provided and non-empty. |
| `ticketCount` | integer | No | Computed by the system. |

### Response (success)

resolution time and ticket count per agent

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Invalid query/path parameter |
| 401/403 | Caller lacks permission to view this data |
| 404 | Ticket not found |

### Notes

- Aggregate resolved tickets by assignedAgentId and compute average resolution time from the ticket history log.
