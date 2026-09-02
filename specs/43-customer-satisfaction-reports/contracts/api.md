# API Contract: Customer satisfaction reports

## `GET /api/reports/csat`

### Request

dateFrom, dateTo

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `rating` | integer | Yes | Must be an integer between 1 and 5. |
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `submittedAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

### Response (success)

aggregated CSAT score for the period

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Invalid query/path parameter |
| 401/403 | Caller lacks permission to view this data |
| 404 | Feedback not found |

### Notes

- Aggregate the Feedback table into an average/percentage-satisfied score over the requested period.
