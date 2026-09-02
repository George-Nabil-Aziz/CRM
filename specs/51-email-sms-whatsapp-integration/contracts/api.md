# API Contract: Email, SMS and WhatsApp integration

## `POST /api/integrations/channels`

### Request

channel type plus provider credentials

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `channel` | string (enum) | Yes | Must be one of the allowed values for this field. |
| `credentials` | string | Yes | Must be provided and non-empty. |
| `status` | string (enum) | No | Defaults to the resource's initial state if omitted. |

### Response (success)

saved and validated channel configuration

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Missing/invalid field |
| 401/403 | Caller lacks permission |
| 409 | Duplicate ChannelConfig |

### Notes

- Store provider credentials encrypted at rest and validate them with a test call before marking the channel active.
