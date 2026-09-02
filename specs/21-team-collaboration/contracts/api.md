# API Contract: Team collaboration

## `POST /api/tickets/{id}/internal-notes`

### Request

text, mentionedUserIds

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `authorId` | string (UUID) | Yes | Must reference an existing record. |
| `text` | string | Yes | Must be provided and non-empty. |
| `mentions` | string | Yes | Must be provided and non-empty. |

### Response (success)

created internal note

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Missing/invalid field |
| 401/403 | Caller lacks permission |
| 404 | Parent resource in the path not found |

### Notes

- Internal notes are stored separately from customer-facing messages and never sent externally.
