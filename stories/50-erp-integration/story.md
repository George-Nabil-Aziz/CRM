# Story: ERP integration

**Number**: 50
**Area**: Integrations
**Priority**: P4

## What do we want?

**As a** Admin, **I want to** connect the CRM to the ERP system, **so that** customer/order data stays synced.

## Context

This story is one of the Integrations capabilities from the source feature list. It matters because without it, a(n) Admin cannot connect the CRM to the ERP system, which blocks the value described above from being delivered.

## Example

Concretely: **Given** an ERP connection is configured, **When** customer/order data changes in the ERP, **Then** the CRM reflects the update

## Why it matters

Customer/order data stays synced. Priority P4 reflects how central this is relative to the rest of the Integrations area and the product as a whole — see `../../specs/50-erp-integration/spec.md` for the full technical specification of exactly what the system must do.
