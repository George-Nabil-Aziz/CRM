# API Contract: Response/resolution targets

## `POST /api/sla-rules`

### Request

category, priority, responseTargetMinutes, resolutionTargetMinutes

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `category` | string (enum) | Yes | Must be one of the allowed values for this field. |
| `priority` | string (enum) | Yes | Must be one of the allowed values for this field. |
| `responseTargetMinutes` | string | Yes | Must be provided and non-empty. |
| `resolutionTargetMinutes` | string | Yes | Must be provided and non-empty. |

### Response (success)

created SLA rule

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Missing/invalid field |
| 401/403 | Caller lacks permission |
| 409 | Duplicate SlaRule |

### Notes

- New tickets look up the matching SlaRule by category/priority and stamp response/resolution due timestamps on creation.
