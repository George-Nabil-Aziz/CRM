# API Contract: Alerts and notifications

## `EVENT notification dispatch on SLA threshold`

### Request

none (triggered by the SLA monitor job)

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `userId` | string (UUID) | Yes | Must reference an existing record. |
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `type` | string (enum) | Yes | Must be one of the allowed values for this field. |
| `sentAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

### Response (success)

notification delivered to agent/supervisor

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
N/A — internal event handler, not a directly callable HTTP endpoint. Failures are logged and surfaced via the audit log / alerting, not HTTP status codes.

### Notes

- Reuse a generic Notification table/dispatcher so SLA alerts, mentions, and reminders share one delivery mechanism.
