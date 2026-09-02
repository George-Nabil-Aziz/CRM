# API Contract: Assign tickets to agents

## `POST /api/tickets/{id}/assign`

### Request

agentId

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `assignedAgentId` | string (UUID) | Yes | Must reference an existing record. |

### Response (success)

updated ticket with assignedAgentId

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Missing/invalid field |
| 401/403 | Caller lacks permission |
| 404 | Parent resource in the path not found |

### Notes

- Assignment endpoint is also called internally by the automatic-assignment rule engine.
