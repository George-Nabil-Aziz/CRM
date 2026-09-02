# API Contract: Access FAQs

## `GET /api/portal/kb`

### Request

optional q search param

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `same as the public knowledge-base articles` | string | Yes | Must be provided and non-empty. |

### Response (success)

FAQ/article list

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Invalid query/path parameter |
| 401/403 | Caller lacks permission to view this data |
| 404 | Article not found |

### Notes

- Portal reuses the public knowledge-base browse and search endpoints directly.
