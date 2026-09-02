# Story: Configure permissions

**Number**: 46
**Area**: Security & Administration
**Priority**: P2

## What do we want?

**As a** Admin, **I want to** adjust a role's permissions, **so that** users' access updates immediately.

## Context

This story is one of the Security & Administration capabilities from the source feature list. It matters because without it, a(n) Admin cannot adjust a role's permissions, which blocks the value described above from being delivered.

## Example

Concretely: **Given** a role, **When** an admin adjusts its permissions, **Then** users with that role gain/lose the corresponding access immediately

## Why it matters

Users' access updates immediately. Priority P2 reflects how central this is relative to the rest of the Security & Administration area and the product as a whole — see `../../specs/46-configure-permissions/spec.md` for the full technical specification of exactly what the system must do.
