# API Contract: AI chatbot

## `POST /api/chatbot/message`

### Request

customer message text

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `customerId` | string (UUID) | Yes | Must reference an existing record. |
| `messages` | string | Yes | Must be provided and non-empty. |
| `handedOff` | string | Yes | Must be provided and non-empty. |

### Response (success)

chatbot reply or handoff-to-agent signal

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Missing/invalid field |
| 401/403 | Caller lacks permission |
| 409 | Duplicate ChatbotSession |

### Notes

- Chatbot answers from the knowledge base first; if confidence is low or the customer asks for a human, hand off to a live-chat ticket.
