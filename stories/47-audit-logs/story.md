# Story: Audit logs

**Number**: 47
**Area**: Security & Administration
**Priority**: P2

## What do we want?

**As a** Admin, **I want to** review an audit log of key actions, **so that** I can investigate and ensure accountability.

## Context

This story is one of the Security & Administration capabilities from the source feature list. It matters because without it, a(n) Admin cannot review an audit log of key actions, which blocks the value described above from being delivered.

## Example

Concretely: **Given** any security-relevant or config change, **When** it occurs, **Then** it is recorded in the audit log with who/what/when

## Why it matters

I can investigate and ensure accountability. Priority P2 reflects how central this is relative to the rest of the Security & Administration area and the product as a whole — see `../../specs/47-audit-logs/spec.md` for the full technical specification of exactly what the system must do.
