# Feature Specification: Automatic assignment

**Number**: 23
**Area**: SLA & Automation
**Priority**: P2
**Status**: Draft

## User Story

As a(n) **System**, I want to **auto-assign a new ticket based on rules**, so that **agents don't have to manually pick up tickets**.

## Description

This story covers the `EVENT ticket.created event handler` capability in the SLA & Automation area. On ticket creation, evaluate AssignmentRules in priority order and call the same assign endpoint used by supervisors.

## Acceptance Criteria

1. **Happy path** — **Given** an assignment rule, **When** a matching ticket is created, **Then** it is auto-assigned without manual intervention
2. **Invalid input** — Given no rule/condition matches the ticket, **When** the event fires, **Then** the ticket is left for manual handling and no error is raised.
3. **Not found / conflict** — Given the automation logic itself fails (e.g. an upstream AI service is unavailable), **When** it runs, **Then** the failure is logged and the ticket proceeds without the automated step rather than getting stuck.
4. **Authorization** — Given the same event fires twice for the same ticket, **When** it is processed, **Then** the action is not applied twice (idempotent).

## Functional Requirements

- **FR-23-1**: System MUST allow a(n) System to auto-assign a new ticket based on rules via `EVENT ticket.created event handler`.
- **FR-23-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-23-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-23-4**: System MUST support round-robin assignment within a team when multiple agents match.
- **FR-23-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the SLA & Automation area.

## Data Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (UUID) | No | System-generated identifier. |
| `condition` | string | Yes | Must be provided and non-empty. |
| `targetAgentOrTeam` | string | Yes | Must be provided and non-empty. |

## Edge Cases

- **Repeated firing**: if the same event fires twice for the same ticket (e.g. a delivery retry), the handler is safe to run twice — the action is not applied a second time (see Idempotency below).
- **Downstream dependency unavailable**: the request fails fast with 503 (or, for internal handlers/jobs, logs and alerts) and no partial state is persisted; the caller/job can safely retry.
- **In-progress state**: the action completes synchronously (or on its normal schedule/dispatch); there is no separate long-running 'in progress' state for the caller to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
