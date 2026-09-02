# API Contract: Escalation rules

## `JOB sla-monitor scheduled job`

### Request

none (scheduled job scans open tickets)

### Request Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `responseTargetAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |
| `resolutionTargetAt` | string (ISO 8601 datetime) | No | System-generated timestamp, not caller-supplied. |
| `escalated` | string | Yes | Must be provided and non-empty. |

### Response (success)

breached tickets marked escalated and notified

### Status Codes

| Code | Meaning |
|---|---|
| 200/201 | Success |
N/A for the scheduled trigger. If a manual-trigger endpoint exists: `202` accepted (run queued), `409` a run is already in progress.

### Notes

- Run a periodic job that scans tickets past their SLA due timestamp and calls the same escalate endpoint agents use.
