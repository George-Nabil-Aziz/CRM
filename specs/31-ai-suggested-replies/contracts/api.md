# API Contract: AI suggested replies

## `POST /api/tickets/{id}/ai/suggest-reply`

### Request

none (uses ticket context)

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `ticketId` | string (UUID) | Yes | Must reference an existing record. |
| `suggestedText` | string | Yes | Must be provided and non-empty. |

### Response (success)

suggested reply text

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Missing/invalid field |
| 401/403 | Caller lacks permission |
| 404 | Parent resource in the path not found |

### Notes

- Prompt the LLM with the ticket thread plus relevant knowledge-base articles to ground the suggestion.
