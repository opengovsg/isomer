# Zip library selection for batch audit-log-export delivery

## Recommendation

Use **[`archiver`](https://www.npmjs.com/package/archiver)** (`archiverjs/node-archiver`, MIT license). It is a pure streaming zip/tar library built directly on Node's `stream.Transform` — you `.append()` each per-site CSV as its own readable stream (or the same `createCsvTransform()` output already used today) and `.pipe()` the archive's own readable output straight into `@aws-sdk/lib-storage`'s `Upload`, the exact same multipart-upload sink `uploadAuditLogExport` already uses in `apps/studio/src/lib/s3.ts:422-442`. Nothing about the existing "Postgres cursor → CSV transform → S3" pipeline needs to change in kind — the zip step is just one more transform stage inserted in the middle, and the whole chain stays O(1) memory regardless of how many sites or how large each site's CSV is.

`yazl` is also a legitimate streaming option (lower-level, smaller, `ZipFile` exposes an `outputStream`) and would work too, but it requires you to manually track per-entry sizes/CRCs in some code paths and has a much smaller community/usage footprint. `jszip` is disqualified outright for this use case: it is an in-memory, buffer-everything API (`generateAsync` returns one Buffer/Blob for the whole archive) with no true streaming output, which directly conflicts with the entire point of the existing pattern — never materializing a full export in memory. Given batch exports can already include every Site row on the platform (see Q4), buffering the whole zip is the wrong default. `archiver` is the safer, better-trodden choice for a Node backend job with the strongest community track record of the three.

---

## 1. Comparing archiver, yazl, and jszip

| | `archiver` | `yazl` | `jszip` |
|---|---|---|---|
| Model | Stream-based; wraps `zip-stream`/`tar-stream`; the whole archiver instance IS a readable stream | Stream-based; lower-level, you build a `ZipFile` and read its `outputStream` | Buffer-based; builds the whole zip in memory, `generateAsync()`/`generateNodeStream()` (a *thin* wrapper that still needs the full structure built first) |
| API ergonomics | High-level: `archive.append(readableStream, { name })`, `archive.pipe(dest)`, `archive.finalize()` | Low-level: `zipfile.addReadStream(stream, name)`, `zipfile.outputStream.pipe(dest)`, `zipfile.end()` — no built-in progress/error aggregation helpers | High-level but memory-oriented: `zip.file(name, streamOrBuffer)`, `zip.generateAsync({type: 'nodebuffer'})` |
| Memory behavior for N large CSV streams | Backpressure-aware; each entry is compressed and flushed as it's appended, only current entry + zip encoder buffers live in memory | Same class of behavior as archiver — genuinely streaming, entry by entry | Effectively requires holding entry contents (or produces the full central directory + all compressed bytes) before it can hand back a stream/buffer — not suited to large multi-GB aggregates |
| Fit for "many large CSV streams, server job, then to S3" | Best fit — this is its explicit design goal (its own docs advertise it for exactly this: streaming large archives without buffering) | Workable, but you own more plumbing (manual entry bookkeeping, no built-in `.append()` convenience for arbitrary readables the way archiver has, though it does accept streams) | Poor fit — the "streaming" JSZip offers is streaming the *serialization of an already-buffered/being-built* zip, not streaming multiple independent large source streams through it without holding them |
| Ecosystem maturity | Very large (~37M weekly downloads, see §3), long history, used widely for exactly this kind of "N files → one zip → HTTP/S3" job | Smaller footprint (~2.5M weekly downloads), stable, minimal-scope by design | Very large (~30M weekly downloads) but that usage skew is dominated by browser/client-side use cases (build zip in browser, download via Blob), not server-side streaming pipelines |

**Verdict**: `archiver`'s append-many-streams-then-pipe-once API maps almost one-to-one onto what this job already does per-site (stream a Kysely cursor through `createCsvTransform()`), so adopting it changes the shape of the pipeline the least. `yazl` would also technically satisfy the "no full buffering" requirement, but there's no material advantage over `archiver` here, and `archiver`'s bigger community/download numbers make it the lower-risk pick for a codebase that otherwise has zero zip-library precedent to lean on.

---

## 2. Streaming a zip straight into the existing S3 multipart pattern

Yes — `archiver`'s `Archiver` instance is itself a `Readable` stream (it extends through `zip-stream`, which extends Node's `stream.Transform`), so it can be piped directly into `@aws-sdk/lib-storage`'s `Upload`, exactly the way `uploadAuditLogExport` already hands a `Readable | string` body to `Upload` today (`apps/studio/src/lib/s3.ts:422-441`). No full-archive buffering is required — `Upload` auto-switches to multipart once the piped stream exceeds one part, per the comment already in that file (`apps/studio/src/lib/s3.ts:417-421`).

Illustrative sketch (does not need to compile), mirroring the existing per-site generate path in `apps/studio/src/server/modules/audit/auditLogExport.service.ts:551-587`:

```ts
import archiver from "archiver"
import { Upload } from "@aws-sdk/lib-storage"

// One archive per batch request, one entry per site.
const zipStream = archiver("zip", { zlib: { level: 9 } })
zipStream.on("warning", (err) => { /* non-fatal (e.g. stat failures) */ })
zipStream.on("error", (err) => { throw err }) // surfaces into the caller's catch/retry path

// Kick off the S3 upload against the archive's own readable output —
// same shape as today's `uploadAuditLogExport({ key, body: csvStream })`.
const upload = new Upload({
  client: storage,
  params: {
    Bucket,
    Key: `audit-log-exports/batch/${requestId}/audit-logs.zip`,
    Body: zipStream, // archiver is itself a Readable
    ContentType: "application/zip",
  },
})
const uploadDone = upload.done()

// For each site, build the same rowStream -> createCsvTransform() pipeline
// already used per-site today, and append it as one zip entry instead of
// uploading it directly.
for (const site of sites) {
  const rowStream = Readable.from(
    activityReportQuery({ siteId: site.id, auditLogDateRange }).stream(STREAM_CHUNK_SIZE),
  )
  const csvStream = createCsvTransform()
  rowStream.on("error", (error) => csvStream.destroy(error))
  rowStream.pipe(csvStream)

  // archive.append() takes a readable stream + an entry name; it does not
  // resolve until archiver has consumed it, but you can queue several —
  // archiver serializes entries internally.
  zipStream.append(csvStream, { name: `${site.name}.csv` })
}

zipStream.finalize() // signals "no more entries"; archive's readable end fires after flushing
await uploadDone
```

The only structural change versus today's per-site path is: (a) `createCsvTransform()` output streams get named and `.append()`-ed to an `Archiver` instead of being handed straight to `uploadAuditLogExport`, and (b) there is one `Upload`/multipart-upload call per *batch request* instead of one per site. Backpressure is preserved end-to-end: Postgres cursor → CSV transform → zip entry → zip encoder → S3 multipart part, with no full-file or full-archive buffering at any stage.

---

## 3. Maintenance status and license

**WebFetch was available and used** for this section (via `WebFetch` against `registry.npmjs.org`, `api.npmjs.org`, and the GitHub repo pages). Two caveats on reliability, noted explicitly below: (1) `npmjs.com` package *pages* (the human-facing site) returned HTTP 403 to WebFetch — the data below instead comes from the raw `registry.npmjs.org` JSON API and `api.npmjs.org` downloads API, which did return data; (2) WebFetch summarizes large JSON through a small model and truncated at least one registry response (noted inline), so treat exact dates as best-effort rather than guaranteed byte-accurate.

| Package | Latest version | License | Weekly downloads (npm, week of Aug 31–Sep 6, 2026) | GitHub open issues / open PRs / stars |
|---|---|---|---|---|
| [`archiver`](https://registry.npmjs.org/archiver) ([GitHub](https://github.com/archiverjs/node-archiver)) | 8.0.0 (publish date not retrievable — registry response was truncated before reaching version 8.0.0's `time` entry) | MIT | 36,818,154 | 142 / 31 / ~3,000 stars, 249 forks, 954 commits |
| [`yazl`](https://registry.npmjs.org/yazl) ([GitHub](https://github.com/thejoshwolfe/yazl)) | 3.3.1, published 2024-11-23 | MIT | 2,545,510 | 14 / 6 / 150 total commits |
| [`jszip`](https://registry.npmjs.org/jszip) ([GitHub](https://github.com/Stuk/jszip)) | 3.10.2 — registry reported this as published 2026-09-08 (i.e. essentially "yesterday" relative to today, 2026-09-09); this is surprising for a version number that has been stable for years in general usage, so **treat this specific date as unverified/possibly a metadata-only republish or a tool artifact**, not a confirmed fresh feature release | MIT OR GPL-3.0-or-later (dual-licensed) | 30,245,822 | 358 / 29 / 10.4k stars, 743 commits |

None of the three is abandoned. `archiver` has the largest download share and the most community usage precedent for exactly this "assemble many streams into one zip, server-side" job, at the cost of a larger open-issue backlog (142) than `yazl`'s (14) — consistent with `archiver` simply having a much bigger, more general-purpose surface area (zip *and* tar, glob support, etc.) than `yazl`'s narrowly-scoped zip-only API. `jszip`'s issue count (358) is the largest of the three and its usage is dominated by browser-side, buffer-oriented use cases rather than the server streaming pattern this project needs — reinforcing the §1 disqualification independent of maintenance status.

---

## 4. Scale: how many sites can one "all sites" batch include today?

Traced end-to-end:

- `audit.router.ts:61-63` (`createExportRequest` mutation): when `scope !== "site"` (i.e. `"allSites"`), `siteIds = await getAdminSiteIds(ctx.user.id)` — resolved **server-side**, never trusted from client input.
- `apps/studio/src/server/modules/site/site.service.ts:54-76` (`getAdminSiteIds`): if the caller is an active Isomer Admin, it returns **every single `Site` row in the entire platform** (`db.selectFrom("Site").select("id")...execute()` — no `LIMIT`, no pagination). If the caller is a regular per-site Admin, it's scoped down to just the sites where they hold an active `Admin` `ResourcePermission`.
- `auditLogExport.service.ts:112-131` (`createAuditLogExportRequestsForSites`): takes that `siteIds: number[]` and fans it out into one `AuditLogExportRequest` row per site, batched into set-based queries in a single transaction — the code comment explicitly frames this design around avoiding "one DB transaction per site" for exactly this "for an Isomer Admin, every site on the platform" case (see the comment at `auditLogExport.service.ts:104-111`).

So **an Isomer Admin's "all sites" batch export request today includes literally every `Site` row that exists**, with no cap in code.

Order-of-magnitude estimate for how many `Site` rows that actually is: I could not find a live count, a seed script that creates a representative number of sites, or explicit documentation stating a production site count anywhere in this repo (checked `packages/db/prisma/schema.prisma:154-179` for the `Site` model itself — no comment with a count; searched for `seed*` files — `apps/studio/prisma/seed.ts`, `apps/studio/tests/e2e/fixtures/seed.ts`, and `tooling/seed-from-repo` exist but are dev/test fixtures seeding a handful of demo sites, not indicative of production scale). Reasoning from the domain instead: Isomer is described in this repo's own `CLAUDE.md` as "a government CMS/site builder platform (Open Government Products, Singapore)" — i.e., it hosts individual sites for Singapore government ministries, statutory boards, and agencies. Singapore's whole-of-government agency count (ministries + statutory boards + department-level entities) is commonly cited in the low hundreds, and a next-gen CMS platform mid-rollout would realistically host anywhere from dozens up to perhaps ~300-500 sites at scale, not thousands. **This is a rough guess reasoned from domain knowledge of Singapore's government structure, not a number found in code — flagged explicitly as such.**

Given each site's audit-log CSV can itself be arbitrarily large (a full month of `AuditLog` activity across every resource on a site — the query in `auditLogExport.query.ts:250-429` has no row cap, and rows are already streamed in `STREAM_CHUNK_SIZE = 500` cursor batches per `auditLogExport.service.ts:333-336`), a batch of "low hundreds of sites × potentially large per-site CSVs" is squarely in the range where streaming assembly (not buffering) matters. This confirms the `archiver`-over-`jszip` recommendation in §1 independent of the exact site count: even if the true count turns out to be on the smaller end (dozens), there's no downside to the streaming approach, and if it's on the larger end (hundreds), buffering the whole zip in memory would be a real risk.

---

## Citations

- `apps/studio/src/server/modules/audit/auditLogExport.query.ts:513-530` — `createCsvTransform`, the existing streaming CSV serializer.
- `apps/studio/src/server/modules/audit/auditLogExport.service.ts:333-336` — `STREAM_CHUNK_SIZE`, Kysely cursor batch size.
- `apps/studio/src/server/modules/audit/auditLogExport.service.ts:551-587` — per-site generate path: Postgres cursor → `createCsvTransform()` → `uploadAuditLogExport`.
- `apps/studio/src/server/modules/audit/auditLogExport.service.ts:104-131` — `createAuditLogExportRequestsForSites`, including the comment framing "for an Isomer Admin, every site on the platform."
- `apps/studio/src/server/modules/audit/audit.router.ts:38-63` — `createExportRequest` mutation, `scope === "allSites"` → `getAdminSiteIds`.
- `apps/studio/src/server/modules/site/site.service.ts:54-76` — `getAdminSiteIds`, unpaginated `SELECT id FROM Site` for Isomer Admins.
- `apps/studio/src/lib/s3.ts:412-442` — `uploadAuditLogExport`, the existing `@aws-sdk/lib-storage` `Upload` streaming-multipart pattern this zip step should mirror.
- `packages/db/prisma/schema.prisma:154-179` — `Site` model (no count hints in comments).
- `apps/studio/package.json`, root `package.json` — confirmed no existing dependency matching `archiver|jszip|adm-zip|yazl|zip-stream` (`grep` returned no matches).
- [npm: archiver](https://www.npmjs.com/package/archiver) / [registry.npmjs.org/archiver](https://registry.npmjs.org/archiver) / [GitHub: archiverjs/node-archiver](https://github.com/archiverjs/node-archiver)
- [npm: yazl](https://www.npmjs.com/package/yazl) / [registry.npmjs.org/yazl](https://registry.npmjs.org/yazl) / [GitHub: thejoshwolfe/yazl](https://github.com/thejoshwolfe/yazl)
- [npm: jszip](https://www.npmjs.com/package/jszip) / [registry.npmjs.org/jszip](https://registry.npmjs.org/jszip) / [GitHub: Stuk/jszip](https://github.com/Stuk/jszip)
