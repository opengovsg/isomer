---
status: accepted
---

# Access report reflects point-in-time access, not current access

The Audit Log Export's **Access report** (`type: "users"`) answers *who had access to the site as of the end of the selected month*, reconstructed from `ResourcePermission.createdAt`/`deletedAt` (include rows where `createdAt <= monthEnd AND (deletedAt IS NULL OR deletedAt > monthEnd)`). For the current month, the as-of date collapses to "now". We chose this because the feature is framed around a selected month and the design calls for "time-in-point Access Logs" — an access *audit* must show who could access the site during the period under review, not who happens to hold access today.

## Considered options

- **Current access (ignore the month)** — what the original one-off script (`apps/studio/prisma/scripts/getAuditLogs.ts`) does: `WHERE rp.deletedAt IS NULL`, no date filter. Simpler and the obvious reading of the query, but it answers the wrong question for a monthly audit and contradicts the point-in-time design.
- **List access changes within the month** — grants/revocations that occurred in the window. Rejected: that is really the Activity report's job (`PermissionCreate`/`PermissionDelete` events), not a snapshot.

## Consequences

A reader comparing this against the existing script will see the query reconstructing historical state from soft-delete timestamps rather than reading current permissions — this is deliberate, not an oversight. The reconstruction is only as accurate as the soft-delete history; hard-deleted or back-filled permission rows would not be represented faithfully.
