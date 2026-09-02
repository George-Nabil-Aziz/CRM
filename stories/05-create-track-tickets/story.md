# Story: Create and track tickets

**Number**: 05
**Area**: Ticket Management
**Priority**: P1

## What do we want?

**As a** Agent, **I want to** create a ticket for a customer issue, **so that** the issue is tracked from open to resolved.

## Context

This story is one of the Ticket Management capabilities from the source feature list. It matters because without it, a(n) Agent cannot create a ticket for a customer issue, which blocks the value described above from being delivered.

## Example

Concretely: **Given** a customer issue, **When** an agent creates a ticket, **Then** it is saved with a unique ID and "open" status and can be tracked to closure

## Why it matters

The issue is tracked from open to resolved. Priority P1 reflects how central this is relative to the rest of the Ticket Management area and the product as a whole — see `../../specs/05-create-track-tickets/spec.md` for the full technical specification of exactly what the system must do.
