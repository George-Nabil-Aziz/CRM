# Story: Multi-branch

**Number**: 56
**Area**: Platform
**Priority**: P4

## What do we want?

**As a** Admin, **I want to** scope tickets/customers to branches, **so that** operations across branches are separated and tracked.

## Context

This story is one of the Platform capabilities from the source feature list. It matters because without it, a(n) Admin cannot scope tickets/customers to branches, which blocks the value described above from being delivered.

## Example

Concretely: **Given** an organization with branches, **When** a ticket/customer is created, **Then** it is scoped to the correct branch

## Why it matters

Operations across branches are separated and tracked. Priority P4 reflects how central this is relative to the rest of the Platform area and the product as a whole — see `../../specs/56-multi-branch/spec.md` for the full technical specification of exactly what the system must do.
