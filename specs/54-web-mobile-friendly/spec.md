# Feature Specification: Web and mobile friendly

**Number**: 54
**Area**: Platform
**Priority**: P4
**Status**: Draft

## User Story

As a(n) **User**, I want to **use the CRM on web and mobile**, so that **I can access it from any device**.

## Description

This story covers the `CLIENT N/A - responsive layout` capability in the Platform area. Build the UI with a responsive layout system (breakpoints/grid) rather than separate mobile/desktop codebases.

## Acceptance Criteria

1. **Happy path** — **Given** any user, **When** they access the CRM from a phone or desktop browser, **Then** the interface adapts and remains fully usable
2. **Invalid input** — Given no explicit preference is set, **When** the user first visits, **Then** a sensible default (browser locale / responsive breakpoint) is used automatically.
3. **Not found / conflict** — Given the user changes the setting, **When** they reload the app or return later, **Then** their preference persists.
4. **Authorization** — Given an unsupported or invalid value is requested, **When** it's applied, **Then** the system falls back to the default without breaking the UI.

## Functional Requirements

- **FR-54-1**: System MUST allow a(n) User to use the CRM on web and mobile via `CLIENT N/A - responsive layout`.
- **FR-54-2**: System MUST validate every field listed under Requirements > Data Fields below and reject invalid requests with a 400 error.
- **FR-54-3**: System MUST ensure this action is only performed by an authorized caller (matching role/permission) or an authenticated system process.
- **FR-54-4**: System MUST verify touch-target sizing for key actions on small screens.
- **FR-54-5**: Changes made by this story MUST be immediately visible through the corresponding read endpoint(s) for the Platform area.

## Data Fields

Not applicable — this is client-side behavior with no request/response payload.

## Edge Cases

- **No stored preference yet**: if the user has no saved layout preference, the responsive breakpoint is chosen automatically from the viewport size rather than failing or prompting.
- **Downstream dependency unavailable**: not applicable — no server dependency is involved in rendering the responsive layout.
- **In-progress state**: layout changes apply immediately on the client; there is no separate "in progress" state to poll.

## Assumptions

- Standard staff/customer authentication (per the platform's Security & Administration area) already exists and is enforced ahead of this endpoint.
- Field-level validation rules follow the Data Fields table above unless a future clarification overrides them.
