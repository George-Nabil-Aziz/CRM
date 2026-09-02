# Story: Automatic assignment

**Number**: 23
**Area**: SLA & Automation
**Priority**: P2

## What do we want?

**As a** System, **I want to** auto-assign a new ticket based on rules, **so that** agents don't have to manually pick up tickets.

## Context

This story is one of the SLA & Automation capabilities from the source feature list. It matters because without it, a(n) System cannot auto-assign a new ticket based on rules, which blocks the value described above from being delivered.

## Example

Concretely: **Given** an assignment rule, **When** a matching ticket is created, **Then** it is auto-assigned without manual intervention

## Why it matters

Agents don't have to manually pick up tickets. Priority P2 reflects how central this is relative to the rest of the SLA & Automation area and the product as a whole — see `../../specs/23-automatic-assignment/spec.md` for the full technical specification of exactly what the system must do.
