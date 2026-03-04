---
name: create-release
description: This creates a release for the given tag
allowed-tools: gh
---

# Instructions

Before starting, always double check the tag for the current branch. You should use the latest release that is tied to the current tag.

The language used should be clear and unambiguous and should focus on the impact of the change. Use the github published release notes as a base for the release notes.

You should also read the individual PRs to understand the context of the change.

Instead of overriding the existing release notes, you should put the generated release notes above the original and separate the original and the generated using a divider.

# Template

:rocket: Isomer Next release notes (v0.17.0) :rocket:

**Features**

- OGP Maps can now be embedded on Studio's map component :fyi:
- Download dataset button for DGS

**Fixes**

- Allow jpg uploads :fyi:
- Fix for image showing errors when empty on article page header :fyi:
- Fix for transaction context handling in procedures

**Misc**

- Update VicaSchema to use string literals for boolean options
- Add DGS to CSP
- Replace string event types with AuditLogEvent enums

@isorangers take note of those tagged :fyi:!
For: @isomer-team @isorangers
