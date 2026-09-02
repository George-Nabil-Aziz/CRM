# API Contract: Contact via SMS

## `POST /api/channels/sms/inbound`

### Request

SMS provider webhook payload

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `channel=sms` | string (enum) | Yes | Must be one of the allowed values for this field. |
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

- Connect an SMS provider webhook and map the sender's phone number to a customer record, same as WhatsApp.
