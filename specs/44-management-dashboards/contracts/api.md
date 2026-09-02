# API Contract: Management dashboards

## `GET /api/reports/dashboard`

### Request

optional date range

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `summary of tickets` | string | Yes | Must be provided and non-empty. |
| `SLA` | string | Yes | Must be provided and non-empty. |
| `agent` | string | Yes | Must be provided and non-empty. |
| `CSAT metrics` | string | Yes | Must be provided and non-empty. |

### Response (success)

single payload combining all report summaries

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Invalid query/path parameter |
| 401/403 | Caller lacks permission to view this data |
| 404 | Ticket, SlaRule, Feedback (aggregate) not found |

### Notes

- Compose the dashboard response from the same aggregation queries used by the individual reports, cached for a short TTL.
