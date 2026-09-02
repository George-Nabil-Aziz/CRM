# API Contract: System configuration

## `PATCH /api/settings`

### Request

key, value

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `key` | string | Yes | Must be provided and non-empty. |
| `value` | string | Yes | Must be provided and non-empty. |

### Response (success)

updated setting

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Invalid field value |
| 401/403 | Caller lacks permission to modify this SystemSetting |
| 404 | SystemSetting not found |

### Notes

- Store settings as key/value pairs and cache them in memory, invalidating the cache on update.
