# API Contract: Search knowledge base

## `GET /api/kb/search`

### Request

q (search query)

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | Yes | Must be provided and non-empty. |

### Response (success)

ranked list of matching articles

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Invalid query/path parameter |
| 401/403 | Caller lacks permission to view this data |
| 404 | Article not found |

### Notes

- Index article title/body in a full-text search index for the query endpoint.
