# API Contract: Contact via email

## `POST /api/channels/email/inbound`

### Request

raw inbound email payload from provider webhook

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `channel=email` | string (email) | Yes | Must be a syntactically valid email address. |
| `from` | string | Yes | Must be provided and non-empty. |
| `body` | string | Yes | Must be provided and non-empty. |
| `receivedAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

### Response (success)

202 accepted, ticket id

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 401 | Signature/verification failed |
| 409 | Duplicate delivery (idempotency key already processed) |

### Notes

- Connect an inbound-email webhook that maps sender address to a customer and creates/updates a ticket.
