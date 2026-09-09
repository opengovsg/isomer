---
id: 05-download-token-flow-for-batch-zip
title: Extend the sealed Download Token flow to resolve a shared batch zip
label: wayfinder:grilling
status: open
assignee: null
blocked_by: [04-zip-assembly-storage-design]
map: ../MAP.md
---

## Question

Today's Download Token (`docs/adr/0006-sealed-download-tokens-for-audit-exports.md`)
carries `{purpose: "audit-log-export", requestId}`, is unsealed at
`apps/studio/src/pages/api/audit-log-exports/download.ts`, re-reads the
`AuditLogExportRequest` row, and 302-redirects to a freshly-presigned URL
for that row's single CSV object.

With one zip now shared across every site in a batch, decide:

- What does the token payload identify instead — `batchId`? A new
  dedicated identifier for the zip object from ticket 04's S3 key design?
- Does this need a new `purpose` discriminator (e.g.
  `"audit-log-export-batch"`) alongside the existing one, so the unseal
  logic can tell single-CSV and batch-zip tokens apart and 400 cleanly on
  a shape mismatch (per ADR 0006's existing "strict payload-shape
  validation" pattern) — or does one payload shape cover both?
- What re-read at click time replaces "row is `Done` and within its
  Download Window" for a batch — presumably: every sibling row for the
  `batchId` is terminal and the shared zip object exists, but confirm
  what "the batch's Download Window" anchors to (today: `completedAt` of
  the individual row — ADR 0006 explicitly chose per-request windows
  because of ADR 0005 reuse; a batch has no single `completedAt`).
- Revocation: ADR 0006 notes "flip the row or delete the object and every
  outstanding link dies" — what's the equivalent guarantee for a batch
  zip shared by N rows?

This is the ADR-bearing decision ticket 04 sets up; write the outcome into
the same ADR (or a clearly-linked follow-on section) rather than a
separate document, since token semantics and zip storage are one design,
not two.
