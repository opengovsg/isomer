---
status: accepted
---

# Audit Log Exports reuse Complete Artifacts instead of rejecting duplicates

An Export Request whose `(site, Export Range, report type)` matches an existing **Complete Artifact** — one generated *after* its range had fully elapsed (`generatedAt >= rangeEnd`) — is fulfilled by re-delivering that artifact with a freshly signed URL, not by regenerating the CSV and not by erroring. Duplicate asks while a job is in flight are accepted idempotently (no error, no second request row). The invariant is *the system never does duplicate work*; the completeness predicate is what makes that safe, because audit records are append-only, so a Complete Artifact's content can never change.

## Considered options

- **CONFLICT on duplicate (the previous behaviour)** — rejected: it punished the most common duplicate (a double-click during the in-flight window) with an error, and re-requesting a finished month silently regenerated a byte-identical file.
- **Naive range-equality reuse** — rejected for the *last-day trap*: an export of the current month generated on its final day carries the full-month range but is missing that day's later events; range equality alone would let that snapshot masquerade as the authoritative month export forever. Hence the `generatedAt >= rangeEnd` predicate — in-progress-month exports (clamped ranges) are point-in-time snapshots and always regenerate, which is not duplicate work because the data is still growing.
- **Per-user reuse** — rejected: an artifact is a function of `(site, range, type)` only; regenerating it for a second Site Admin of the same site produces an identical file. Reuse is therefore per-site, while Export Request rows stay per-user for provenance and email delivery.

## Consequences

- Asking is always safe and always recorded: every ask emits an `AuditLogExportCreate` audit event (displayable in the Activity report — agencies can see who exports their logs), and every ask that queues or delivers work inserts its own request row. The in-flight duplicate is the one case that records an event only.
- Delivery stays uniform async per ADR-0004: the worker makes the generate-or-deliver choice, verifies the S3 object still exists (a vanished object falls back to regeneration — this is what keeps a future object-lifecycle policy safe to add), and emails a fresh 3-day URL.
- Re-delivery makes artifacts long-lived by design: once a past month is generated, later requesters keep receiving that same object. If artifact content ever needs to change (schema fix, redaction), the object must be deleted or the rows invalidated — reuse has no version check.
