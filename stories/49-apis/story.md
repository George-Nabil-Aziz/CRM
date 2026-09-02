# Story: APIs

**Number**: 49
**Area**: Integrations
**Priority**: P4

## What do we want?

**As a** Developer, **I want to** call the CRM API from an external system, **so that** we can integrate without manual re-entry.

## Context

This story is one of the Integrations capabilities from the source feature list. It matters because without it, a(n) Developer cannot call the CRM API from an external system, which blocks the value described above from being delivered.

## Example

Concretely: **Given** an authorized external system, **When** it calls the CRM API, **Then** it can create/read/update tickets and customers per its permissions

## Why it matters

We can integrate without manual re-entry. Priority P4 reflects how central this is relative to the rest of the Integrations area and the product as a whole — see `../../specs/49-apis/spec.md` for the full technical specification of exactly what the system must do.
