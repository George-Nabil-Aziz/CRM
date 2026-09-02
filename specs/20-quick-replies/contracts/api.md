# API Contract: Use quick replies

## `GET /api/quick-replies`

### Request

optional category filter

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `title` | string | Yes | Must be provided and non-empty. |
| `body` | string | Yes | Must be provided and non-empty. |
| `category` | string (enum) | Yes | Must be one of the allowed values for this field. |

### Response (success)

list of quick-reply templates

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Invalid query/path parameter |
| 401/403 | Caller lacks permission to view this data |
| 404 | QuickReply not found |

### Notes

- Maintain a QuickReply table editable by admins; the compose box fetches and inserts the chosen template's body.
