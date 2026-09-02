# API Contract: Submit feedback

## `POST /api/portal/tickets/{id}/feedback`

### Request

rating (1-5), comment

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `rating` | integer | Yes | Must be an integer between 1 and 5. |
| `comment` | string | Yes | Must be provided and non-empty. |
| `submittedAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

### Response (success)

created feedback record

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Missing/invalid field |
| 401/403 | Caller lacks permission |
| 404 | Parent resource in the path not found |

### Notes

- Only allow feedback submission once a ticket reaches resolved/closed status, one submission per ticket.
