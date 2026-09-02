# API Contract: Unified multi-channel thread

## `GET /api/tickets/{id}/messages`

### Request

none

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `channel` | string (enum) | Yes | Must be one of the allowed values for this field. |
| `from` | string | Yes | Must be provided and non-empty. |
| `body` | string | Yes | Must be provided and non-empty. |
| `sentAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

### Response (success)

list of messages ordered chronologically, each tagged with its channel

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Invalid query/path parameter |
| 401/403 | Caller lacks permission to view this data |
| 404 | Message not found |

### Notes

- All channel handlers write to the same Message table keyed by ticketId, so this is a single query.
