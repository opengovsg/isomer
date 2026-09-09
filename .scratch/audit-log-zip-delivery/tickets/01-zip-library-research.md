---
id: 01-zip-library-research
title: Select a streaming Node zip library for batch export assembly
label: wayfinder:research
status: open
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
