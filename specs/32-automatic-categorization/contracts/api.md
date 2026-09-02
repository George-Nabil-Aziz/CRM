# API Contract: Automatic categorization

## `EVENT ticket.created AI classification step`

### Request

none (runs on ticket creation)

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `category` | string (enum) | Yes | Must be one of the allowed values for this field. |
| `categoryConfidence` | number (0-1) | No | System-generated score, not caller-supplied. |

### Response (success)

ticket stamped with a suggested category

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
N/A — internal event handler, not a directly callable HTTP endpoint. Failures are logged and surfaced via the audit log / alerting, not HTTP status codes.

### Notes

- Run an LLM/classifier call on ticket creation and pre-fill the category field, which the agent can still override.
