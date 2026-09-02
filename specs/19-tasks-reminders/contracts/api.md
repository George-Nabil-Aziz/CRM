# API Contract: Manage tasks and reminders

## `POST /api/tickets/{id}/reminders`

### Request

dueAt, note

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `agentId` | string (UUID) | Yes | Must reference an existing record. |
| `dueAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |
| `note` | string | Yes | Must be provided and non-empty. |

### Response (success)

created reminder

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Missing/invalid field |
| 401/403 | Caller lacks permission |
| 404 | Parent resource in the path not found |

### Notes

- Store reminders in their own table and run a scheduled job that pushes due reminders as notifications.
