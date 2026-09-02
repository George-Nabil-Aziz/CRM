# API Contract: Configure permissions

## `PATCH /api/roles/{id}/permissions`

### Request

list of permission keys

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `name` | string | Yes | Must be provided and non-empty. |
| `permissions` | string | Yes | Must be provided and non-empty. |

### Response (success)

updated role

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Invalid field value |
| 401/403 | Caller lacks permission to modify this Role |
| 404 | Role not found |

### Notes

- Store permissions as a set on the Role and check them via a single authorization middleware on every protected endpoint.
