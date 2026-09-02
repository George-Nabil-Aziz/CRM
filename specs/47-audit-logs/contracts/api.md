# API Contract: Audit logs

## `GET /api/audit-logs`

### Request

optional actor/date filters

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `actorId` | string (UUID) | Yes | Must reference an existing record. |
| `action` | string | Yes | Must be provided and non-empty. |
| `targetType` | string (enum) | Yes | Must be one of the allowed values for this field. |
| `targetId` | string (UUID) | Yes | Must reference an existing record. |
| `timestamp` | string | Yes | Must be provided and non-empty. |

### Response (success)

list of audit log entries

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Invalid query/path parameter |
| 401/403 | Caller lacks permission to view this data |
| 404 | AuditLog not found |

### Notes

- Write an AuditLog row from a shared middleware whenever a security-relevant or config-changing endpoint is called.
