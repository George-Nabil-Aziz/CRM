# API Contract: Contact via live chat

## `WS /ws/chat`

### Request

chat session open plus message events

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `channel=chat` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |
| `from` | string | Yes | Must be provided and non-empty. |
| `body` | string | Yes | Must be provided and non-empty. |
| `sentAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

### Response (success)

real-time message stream to the assigned agent

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 401 | Not authenticated |
| 503 | No agent available / queue full |

### Notes

- Use a WebSocket (or long-poll fallback) session per chat, backed by the same Message/Ticket tables as other channels.
