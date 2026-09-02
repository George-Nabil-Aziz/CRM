# Story: Unified multi-channel thread

**Number**: 16
**Area**: Communication Channels
**Priority**: P2

## What do we want?

**As a** Agent, **I want to** see all of a ticket's messages in one thread regardless of channel, **so that** I don't miss context switching channels.

## Context

This story is one of the Communication Channels capabilities from the source feature list. It matters because without it, a(n) Agent cannot see all of a ticket's messages in one thread regardless of channel, which blocks the value described above from being delivered.

## Example

Concretely: **Given** a ticket with messages from more than one channel, **When** an agent opens it, **Then** all messages appear in a single chronological thread

## Why it matters

I don't miss context switching channels. Priority P2 reflects how central this is relative to the rest of the Communication Channels area and the product as a whole — see `../../specs/16-unified-multichannel-thread/spec.md` for the full technical specification of exactly what the system must do.
