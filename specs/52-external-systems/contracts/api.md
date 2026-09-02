# API Contract: External systems

## `POST /api/integrations/webhooks`

### Request

target url, subscribed events

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `url` | string (URL) | No | Must be a valid URL when present. |
| `events` | string | Yes | Must be provided and non-empty. |
| `secret` | string | Yes | Must be provided and non-empty. |

### Response (success)

created webhook subscription

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Missing/invalid field |
| 401/403 | Caller lacks permission |
| 409 | Duplicate Webhook |

### Notes

- Let external systems subscribe to CRM events (ticket.created, ticket.updated, etc.) via outbound webhooks signed with a shared secret.
