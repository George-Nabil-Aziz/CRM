# Story: Escalation rules

**Number**: 24
**Area**: SLA & Automation
**Priority**: P2

## What do we want?

**As a** System, **I want to** auto-escalate a ticket when its SLA is breached, **so that** issues get attention without being missed.

## Context

This story is one of the SLA & Automation capabilities from the source feature list. It matters because without it, a(n) System cannot auto-escalate a ticket when its SLA is breached, which blocks the value described above from being delivered.

## Example

Concretely: **Given** an SLA target is breached, **When** the breach occurs, **Then** the ticket auto-escalates per the configured rule

## Why it matters

Issues get attention without being missed. Priority P2 reflects how central this is relative to the rest of the SLA & Automation area and the product as a whole — see `../../specs/24-escalation-rules/spec.md` for the full technical specification of exactly what the system must do.
