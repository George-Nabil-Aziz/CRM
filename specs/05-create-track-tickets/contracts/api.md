# API Contract: Create and track tickets

## `POST /api/tickets`

### Request

customerId, subject, category, priority

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `customerId` | string (UUID) | Yes | Must reference an existing record. |
| `subject` | string | Yes | Must be provided and non-empty. |
| `status` | string (enum) | No | Defaults to the resource's initial state if omitted. |
| `category` | string (enum) | Yes | Must be one of the allowed values for this field. |
| `priority` | string (enum) | Yes | Must be one of the allowed values for this field. |
| `createdAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

### Response (success)

created ticket with id and status=open

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Missing/invalid field |
| 401/403 | Caller lacks permission |
| 409 | Duplicate Ticket |

### Notes

- Add a Ticket table with a status state machine (open, pending, resolved, closed).
