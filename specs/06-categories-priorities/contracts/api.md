# API Contract: Categories and priorities

## `PATCH /api/tickets/{id}`

### Request

category, priority

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `category` | string (enum) | Yes | Must be one of the allowed values for this field. |
| `priority` | string (enum) | Yes | Must be one of the allowed values for this field. |

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

- Reuse a fixed lookup table of categories/priorities so values stay consistent across the system.
