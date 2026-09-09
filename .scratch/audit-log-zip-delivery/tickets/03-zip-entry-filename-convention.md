---
id: 03-zip-entry-filename-convention
title: Decide the zip entry filename convention
label: wayfinder:grilling
status: open
assignee: null
blocked_by: []
map: ../MAP.md
---

## Question

Each CSV inside the batch zip must make its source site unambiguous to a
human opening the archive: the original ask calls for siteName **and**
siteId in the filename.

Decide the exact filename format, e.g. something like
`{siteName}-{siteId}-{type}-{rangeSlug}.csv`, and settle:

- **Sanitization**: siteName is free-text (site owners choose it) and may
  contain spaces, slashes, or other filesystem-unsafe characters. What's
  the sanitization rule (e.g. strip/replace non-alphanumerics), and does
  the sanitized form still need siteId appended to guarantee uniqueness
  even if two sites sanitize to the same string?
- **`type` and `rangeSlug`**: reuse whatever vocabulary the existing S3 key
  pattern already uses (`audit-log-exports/{siteId}/{requestId}/{access|activity}-{rangeSlug}.csv`,
  `apps/studio/src/server/modules/audit/auditLogExport.service.ts`) so the
  in-zip name stays recognizable against the underlying artifact.
- Whether this convention should be documented in `CONTEXT.md` (a
  candidate glossary entry, since "Export Artifact" is already defined
  there and this is a display-name derived from it, not a new domain
  concept in its own right — use `domain-modeling` judgment on whether it
  warrants an entry or is just an implementation detail).
