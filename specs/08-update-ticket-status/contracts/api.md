# API Contract: Update ticket status

## `PATCH /api/tickets/{id}/status`

### Request

status

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `status` | string (enum) | No | Defaults to the resource's initial state if omitted. |

### Response (success)

updated ticket

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Invalid field value |
| 401/403 | Caller lacks permission to modify this Ticket |
| 404 | Ticket not found |

### Notes

- Validate status transitions against the allowed state machine (no skipping from open to closed).
