# API Contract: Multi-branch

## `POST /api/branches`

### Request

name, location

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `name` | string | Yes | Must be provided and non-empty. |
| `location` | string | Yes | Must be provided and non-empty. |

### Response (success)

created branch

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Missing/invalid field |
| 401/403 | Caller lacks permission |
| 409 | Duplicate Branch |

### Notes

- Add a branchId foreign key to Ticket and Customer, following the same scoping pattern as multi-department.
