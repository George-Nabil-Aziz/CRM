# API Contract: Multi-department

## `POST /api/departments`

### Request

name

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `name` | string | Yes | Must be provided and non-empty. |

### Response (success)

created department

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Missing/invalid field |
| 401/403 | Caller lacks permission |
| 409 | Duplicate Department |

### Notes

- Add a departmentId foreign key to Ticket and User, and filter ticket queries by the current user's department by default.
