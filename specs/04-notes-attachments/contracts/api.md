# API Contract: Add notes and attachments

## `POST /api/customers/{id}/notes`

### Request

text and/or file attachment

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `customerId` | string (UUID) | Yes | Must reference an existing record. |
| `authorId` | string (UUID) | Yes | Must reference an existing record. |
| `text` | string | Yes | Must be provided and non-empty. |
| `attachmentUrl` | string (URL) | No | Must be a valid URL when present. |
| `createdAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

### Response (success)

created note object

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Missing/invalid field |
| 401/403 | Caller lacks permission |
| 404 | Parent resource in the path not found |

### Notes

- Store note text in the database and uploaded files in object storage, linked by customer id.
