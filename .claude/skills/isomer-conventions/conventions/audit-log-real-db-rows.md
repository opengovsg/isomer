---
title: Audit deltas must log real DB rows, not hand-built objects
category: Audit logging
type: best-practice
---

## Pattern

Mutations to auditable entities must write an audit log. The before/after
`delta` must be populated with the **actual rows read from the database** —
`before` fetched before the mutation, `after` re-fetched after it — not an
object you assembled or mutated in memory from the input payload.

This applies to every typed logger in `audit.service.ts`, not just Resource:
`logResourceEvent` (Resource create/update/delete, schedule publish),
`logUserEvent`, `logPermissionEvent`, `logConfigEvent`, `logPublishEvent`,
`logAuthEvent`. Resource is the worked example below.

Log inside the **same transaction** as the mutation, so `before`/`after`
reflect exactly what the database committed and the write can't succeed without
its audit entry.

## Why

The audit log's whole value is an accurate diff. A hand-built `after` (e.g.
`{ ...before, ...input }`) silently diverges from what the DB actually stored —
column defaults, triggers, coercion, transforms, and computed values are all
missed, so the delta lies. The classic failure is mutating the fetched row in
place and logging it as both sides: `before` and `after` point at the same
object and the delta collapses to nothing. Re-reading real rows is the only way
the delta records the true state transition.

## Bad

```ts
const resource = await tx
  .selectFrom("Resource").where("id", "=", id).selectAll()
  .executeTakeFirstOrThrow()

resource.title = input.title // mutated in place
await tx.updateTable("Resource").set({ title: input.title }).where("id", "=", id).execute()

await logResourceEvent(tx, {
  siteId, by: user, eventType: AuditLogEvent.ResourceUpdate,
  delta: { before: resource, after: resource }, // same object → empty delta
})
```

## Good

```ts
const before = await tx
  .selectFrom("Resource").where("id", "=", id).select(defaultResourceSelect)
  .executeTakeFirstOrThrow()

await tx.updateTable("Resource").set({ title: input.title }).where("id", "=", id).execute()

const after = await tx
  .selectFrom("Resource").where("id", "=", id).select(defaultResourceSelect)
  .executeTakeFirstOrThrow()

await logResourceEvent(tx, {
  siteId, by: user, eventType: AuditLogEvent.ResourceUpdate,
  delta: { before, after }, // two real DB rows
})
```

Creates log `{ before: null, after: <created row> }`; deletes log
`{ before: <row>, after: null }` (capture `before` before deleting). When only
part of a `FullResource` changed (e.g. the blob but not the resource row), the
unchanged half may reuse its fetched row — it's still a real DB row. See the
move handler `resource.router.ts:356` for the fetch → mutate → re-fetch → log
idiom, and `gazette.router.ts` for create/delete.

## How to detect

Look for `logResourceEvent`/`log*Event` calls where `delta.after` is built by
spreading input over `before` (`{ ...before, ...input }`), where `before` and
`after` are the same variable, or where the logged object was mutated in place
rather than re-read. Confirm the log call sits inside the mutation's
`db.transaction().execute(async (tx) => ...)`.
