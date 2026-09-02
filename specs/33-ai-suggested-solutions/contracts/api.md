# API Contract: AI suggested solutions

## `GET /api/tickets/{id}/ai/suggest-solutions`

### Request

none

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `relatedTicketIds` | string | Yes | Must be provided and non-empty. |
| `suggestionText` | string | Yes | Must be provided and non-empty. |

### Response (success)

list of similar resolved tickets/solutions

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Invalid query/path parameter |
| 401/403 | Caller lacks permission to view this data |
| 404 | AiSuggestion not found |

### Notes

- Use embedding similarity search over resolved tickets and knowledge-base articles to find and summarize matches.
