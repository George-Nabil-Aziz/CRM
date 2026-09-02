# API Contract: Arabic and English

## `CLIENT UI locale switch plus Accept-Language header`

### Request

locale=ar or locale=en

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|

### Response (success)

UI re-renders in the selected language, RTL for Arabic

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
N/A — client-side behavior, not a server endpoint.

### Notes

- Externalize all UI strings into locale files (en/ar) and toggle the document direction attribute based on the selected locale.
