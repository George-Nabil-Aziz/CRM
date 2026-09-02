# API Contract: Browse FAQs

## `GET /api/kb/faqs`

### Request

optional category filter

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `title` | string | Yes | Must be provided and non-empty. |
| `category` | string (enum) | Yes | Must be one of the allowed values for this field. |
| `type=faq` | string (enum) | Yes | Must be one of the allowed values for this field. |

### Response (success)

list of FAQ articles

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Invalid query/path parameter |
| 401/403 | Caller lacks permission to view this data |
| 404 | Article not found |

### Notes

- FAQs are just Articles filtered by type=faq; no separate table needed.
