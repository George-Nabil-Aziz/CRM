# API Contract: Escalate tickets

## `POST /api/tickets/{id}/escalate`

### Request

reason

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `escalated` | string | Yes | Must be provided and non-empty. |
| `escalatedAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |
| `escalationReason` | string | Yes | Must be provided and non-empty. |

### Response (success)

updated ticket with escalated=true

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Missing/invalid field |
| 401/403 | Caller lacks permission |
| 404 | Parent resource in the path not found |

### Notes

- Escalation shares logic with the automatic SLA-breach escalation flow.
