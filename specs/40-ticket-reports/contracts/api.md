# API Contract: Ticket reports

## `GET /api/reports/tickets`

### Request

dateFrom, dateTo, optional filters

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `aggregated by status/category/date` | string (enum) | No | Defaults to the resource's initial state if omitted. |

### Response (success)

volume and status breakdown for the period

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Invalid query/path parameter |
| 401/403 | Caller lacks permission to view this data |
| 404 | Ticket not found |

### Notes

- Aggregate directly from the Ticket table with date-range and group-by queries; consider a read replica for heavy reporting.
