# API Contract: Custom branding

## `POST /api/settings/branding`

### Request

logo file upload, color values

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `logoUrl` | string (URL) | No | Must be a valid URL when present. |
| `primaryColor` | string | Yes | Must be provided and non-empty. |
| `secondaryColor` | string | Yes | Must be provided and non-empty. |

### Response (success)

saved branding configuration

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
| 400 | Missing/invalid field |
| 401/403 | Caller lacks permission |
| 409 | Duplicate BrandingConfig |

### Notes

- Store branding as a BrandingConfig record and have the portal/UI fetch and apply it at load time (CSS variables plus logo URL).
