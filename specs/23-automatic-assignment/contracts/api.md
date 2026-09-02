# API Contract: Automatic assignment

## `EVENT ticket.created event handler`

### Request

ticket payload (event-driven, no external caller)

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `condition` | string | Yes | Must be provided and non-empty. |
| `targetAgentOrTeam` | string | Yes | Must be provided and non-empty. |

### Response (success)

ticket updated with assignedAgentId

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
N/A — internal event handler, not a directly callable HTTP endpoint. Failures are logged and surfaced via the audit log / alerting, not HTTP status codes.

### Notes

- On ticket creation, evaluate AssignmentRules in priority order and call the same assign endpoint used by supervisors.
