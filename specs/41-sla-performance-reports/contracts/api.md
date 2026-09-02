# API Contract: SLA performance reports

## `GET /api/reports/sla`

### Request

dateFrom, dateTo, optional team filter

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `responseTargetAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |
| `resolutionTargetAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |
| `actualResponseAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |
| `actualResolutionAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

### Response (success)

compliance rate per team/agent

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Invalid query/path parameter |
| 401/403 | Caller lacks permission to view this data |
| 404 | Ticket not found |

### Notes

- Compute compliance as actual-vs-target timestamps already captured by the SLA and escalation flows.
