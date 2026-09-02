# API Contract: Submit via web form

## `POST /api/channels/webform`

### Request

form fields: name, email, subject, message

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `channel=webform` | string (enum) | Yes | Must be one of the allowed values for this field. |
| `name` | string | Yes | Must be provided and non-empty. |
| `email` | string (email) | Yes | Must be a syntactically valid email address. |
| `body` | string | Yes | Must be provided and non-empty. |
| `submittedAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

### Response (success)

created ticket id

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 401 | Signature/verification failed |
| 409 | Duplicate delivery (idempotency key already processed) |

### Notes

- Validate and rate-limit the public form endpoint since it is unauthenticated.
