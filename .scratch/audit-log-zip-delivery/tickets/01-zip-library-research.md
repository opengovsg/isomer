---
id: 01-zip-library-research
title: Select a streaming Node zip library for batch export assembly
label: wayfinder:research
status: closed
assignee: null
blocked_by: []
map: ../MAP.md
---

## Question

Which Node zip-archive library should assemble the batch export zip, and
how does it stream into the existing S3-multipart-upload pattern already
used for per-site CSV generation (`apps/studio/src/server/modules/audit/auditLogExport.query.ts`,
see `createCsvTransform` and the streamed multipart upload around it)?

No zip library is currently a dependency anywhere in the repo (checked
`apps/studio/package.json` and the root `package.json` for
`archiver|jszip|adm-zip|zip` — no hits).

Cover:

- Candidates: `archiver` (stream-based, widely used), `yazl` (lower-level,
  stream-based), `jszip` (buffers in memory — likely a poor fit for
  potentially many/large per-site CSVs). Recommend one.
- Does the chosen library expose a readable stream that can be piped
  directly into an S3 multipart upload (mirroring how CSV generation
  already streams Postgres cursor rows straight to S3), or does it require
  buffering the whole archive first?
- Maintenance status and license of the recommended package.
- A rough sense of scale: how many sites can appear in one "all sites"
  batch export request today (check `createAuditLogExportRequestsForSites`
  / how "all sites" is resolved in `apps/studio/src/server/modules/audit/audit.router.ts`
  and however many sites currently exist on the platform), so the design
  ticket downstream (04) knows whether streaming vs. buffering actually
  matters at current scale.

## Resolution

Full findings: [`research/01-zip-library-research.md`](../research/01-zip-library-research.md) (from branch `research/audit-zip-library-selection`).

**Use `archiver`** (MIT, `archiverjs/node-archiver`). Its `Archiver` instance
is itself a `Readable` stream — each site's existing `createCsvTransform()`
output gets `.append()`-ed as a named zip entry, and the archive's readable
output pipes straight into the same `@aws-sdk/lib-storage` `Upload` sink
`uploadAuditLogExport` already uses (`apps/studio/src/lib/s3.ts:422-441`).
No full-archive or full-file buffering at any stage — the "never buffer an
export" property of the current pipeline is preserved end-to-end.

`yazl` is a viable but lower-level alternative with a much smaller
community footprint; no material advantage over `archiver` here. `jszip`
is disqualified: it builds the whole zip in memory before it can emit
anything, which directly conflicts with the existing streaming pattern —
"all sites" batch scope resolves to every `Site` row on the platform with
no cap (`getAdminSiteIds`, `site.service.ts:54-76`), so buffering the
whole archive is a real risk, not a theoretical one. No documented site
count exists in-repo; the research flags a reasoned (not measured)
low-hundreds estimate, which doesn't change the recommendation either way.

This unblocks half of ticket 04 (paired with ticket 02's resolution).
