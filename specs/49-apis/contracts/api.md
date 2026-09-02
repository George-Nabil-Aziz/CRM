# API Contract: APIs

## `GET/POST /api/v1/*`

### Request

API key in Authorization header

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `key` | string | Yes | Must be provided and non-empty. |
| `ownerId` | string (UUID) | Yes | Must reference an existing record. |
| `scopes` | string | Yes | Must be provided and non-empty. |

### Response (success)

standard JSON per resource, scoped by key permissions

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Missing/invalid field |
| 401/403 | Caller lacks permission |
| 409 | Duplicate ApiKey |

### Notes

- Issue scoped API keys and gate every /api/v1 route through the same authorization middleware used for staff permissions.
