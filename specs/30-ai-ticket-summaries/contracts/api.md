# API Contract: AI ticket summaries

## `GET /api/tickets/{id}/ai/summary`

### Request

none

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `summaryText` | string | Yes | Must be provided and non-empty. |
| `generatedAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

### Response (success)

generated summary text

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Invalid query/path parameter |
| 401/403 | Caller lacks permission to view this data |
| 404 | AiSummary not found |

### Notes

- Send the ticket's message thread to an LLM summarization call and cache the result until new messages arrive.
