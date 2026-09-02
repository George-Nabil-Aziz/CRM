# Story: Email, SMS and WhatsApp integration

**Number**: 51
**Area**: Integrations
**Priority**: P4

## What do we want?

**As a** Admin, **I want to** configure the email/SMS/WhatsApp provider credentials, **so that** messages send/receive natively.

## Context

This story is one of the Integrations capabilities from the source feature list. It matters because without it, a(n) Admin cannot configure the email/SMS/WhatsApp provider credentials, which blocks the value described above from being delivered.

## Example

Concretely: **Given** a provider is configured, **When** a message arrives through it, **Then** a ticket is created as in the Communication Channels area

## Why it matters

Messages send/receive natively. Priority P4 reflects how central this is relative to the rest of the Integrations area and the product as a whole — see `../../specs/51-email-sms-whatsapp-integration/spec.md` for the full technical specification of exactly what the system must do.
