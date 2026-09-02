# API Contract: Manage knowledge base content

## `POST /api/kb/articles`

### Request

title, body, category, type

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `title` | string | Yes | Must be provided and non-empty. |
| `body` | string | Yes | Must be provided and non-empty. |
| `category` | string (enum) | Yes | Must be one of the allowed values for this field. |
| `type` | string (enum) | Yes | Must be one of the allowed values for this field. |
| `authorId` | string (UUID) | Yes | Must reference an existing record. |
| `publishedAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

### Response (success)

created/updated article

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Missing/invalid field |
| 401/403 | Caller lacks permission |
| 409 | Duplicate Article |

### Notes

- Restrict this endpoint to users with a content-management permission; re-index the article in search on save.
