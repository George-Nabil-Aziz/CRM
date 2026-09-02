# API Contract: Read help articles and guides

## `GET /api/kb/articles/{id}`

### Request

none

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `title` | string | Yes | Must be provided and non-empty. |
| `body` | string | Yes | Must be provided and non-empty. |
| `category` | string (enum) | Yes | Must be one of the allowed values for this field. |
| `type` | string (enum) | Yes | Must be one of the allowed values for this field. |

### Response (success)

full article content

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Invalid query/path parameter |
| 401/403 | Caller lacks permission to view this data |
| 404 | Article not found |

### Notes

- Render article body as sanitized HTML/Markdown; track view counts for popularity ranking.
