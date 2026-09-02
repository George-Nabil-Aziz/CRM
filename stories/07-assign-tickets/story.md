# Story: Assign tickets to agents

**Number**: 07
**Area**: Ticket Management
**Priority**: P1

## What do we want?

**As a** Supervisor, **I want to** assign a ticket to an agent, **so that** workload is distributed.

## Context

This story is one of the Ticket Management capabilities from the source feature list. It matters because without it, a(n) Supervisor cannot assign a ticket to an agent, which blocks the value described above from being delivered.

## Example

Concretely: **Given** an unassigned ticket, **When** a supervisor or rule assigns it, **Then** it appears in the assigned agent's queue

## Why it matters

Workload is distributed. Priority P1 reflects how central this is relative to the rest of the Ticket Management area and the product as a whole — see `../../specs/07-assign-tickets/spec.md` for the full technical specification of exactly what the system must do.
