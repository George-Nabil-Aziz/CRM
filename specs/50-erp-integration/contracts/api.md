# API Contract: ERP integration

## `JOB erp-sync scheduled job (or POST /api/integrations/erp/sync to trigger manually)`

### Request

none (scheduled) or manual trigger

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `entityType` | string (enum) | Yes | Must be one of the allowed values for this field. |
| `externalId` | string (UUID) | Yes | Must reference an existing record. |
| `status` | string (enum) | No | Defaults to the resource's initial state if omitted. |
| `syncedAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |

### Response (success)

sync run summary

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
N/A for the scheduled trigger. If a manual-trigger endpoint exists: `202` accepted (run queued), `409` a run is already in progress.

### Notes

- Pull customer/order records from the ERP's API on a schedule and upsert them into the Customer table, logging each sync.
