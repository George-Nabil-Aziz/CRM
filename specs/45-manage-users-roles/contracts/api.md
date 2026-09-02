# API Contract: Manage users and roles

## `POST /api/users`

### Request

name, email, roleId

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `name` | string | Yes | Must be provided and non-empty. |
| `email` | string (email) | Yes | Must be a syntactically valid email address. |
| `roleId` | string (UUID) | Yes | Must reference an existing record. |

### Response (success)

created user

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Missing/invalid field |
| 401/403 | Caller lacks permission |
| 409 | Duplicate User |

### Notes

- Add a User table with a roleId foreign key to a Role table; send an invite email with a set-password link.
