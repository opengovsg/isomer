# Does Postman.gov.sg support email attachments, and would a batch audit-log zip fit?

## Answer, up front

**Yes, Postman.gov.sg's transactional email API technically supports file attachments — but the limits are small and there's a gating prerequisite Isomer hasn't set up.**

- Up to **10 attachments per email**
- **2 MB per attachment**
- **10 MB cumulative** across all attachments in one email
- A `413` is returned if either limit is exceeded
- Attachments require **multipart/form-data** requests (Isomer's current integration sends plain JSON)
- Attachments are **only available once a custom "from" sending domain is set up** with Postman — "If you are sending attachments in your API emails, then a custom from address is necessary" (FAQ). Isomer's deploy checklist for this exact feature area (`docs/deploy/audit-log-exports.md`) states export emails "ride the existing `sendMail` pipeline; **no new provider config**" was added, i.e. no custom-domain/attachment setup exists today.

A single zip archive is one attachment, so the binding cap for "does the zip fit" is **2 MB** (per-attachment), not 10 MB (that's only relevant if you split into >1 attachment, which isn't the plan here). That is a materially tighter constraint than it sounds once weighed against "every site on the platform" batch scope (see below) — plausible only for a small/early-stage set of sites with modest monthly log volume, and not something to bank on as the platform grows.

## 1. Primary sources read

- Postman Guide — Attachments page: https://postman-v1.guides.gov.sg/email-api-guide/programmatic-email-api/send-email-api/attachments (canonical `guide.postman.gov.sg/api-guide/...` URL 307-redirects here; both are the same official OGP docs site — note the doc site was mid-migration between an `api-guide` and `email-api-guide` path prefix, both point at the same official content)
  - Field: `attachments`, sent as `multipart/form-data` (example given as curl `--form 'attachments=@"/path/to/file"'`, repeatable for multiple files)
  - "Each email can have up to 10 attachments"
  - "Each attachment should not exceed 2MB in size"
  - "The cumulative size of all attachments should not exceed 10MB"
  - `413` returned when these are violated
  - 33 supported file types (asc, avi, bmp, csv, docx, gif, jpeg, jpg, pdf, png, pptx, txt, xlsx, mpeg, mpg, wmv, etc. — no explicit mention of `.zip` in the list surfaced by the fetch; worth double-checking directly against the live page before relying on zip being an accepted MIME type)
- Postman Guide — FAQ: https://postman-v1.guides.gov.sg/email-api-guide/frequently-asked-questions
  - "If you are sending attachments in your API emails, then a custom from address is necessary" — i.e. attachments gate on having a custom sending domain provisioned with Postman, not just an API key
- Postman client repo (found via search, not fetched in depth): https://github.com/opengovsg/postmangovsg-client — an OpenAPI client/nodemailer transport; corroborates that attachments are a first-class, documented API capability rather than an internal-only feature

**Caveat on source freshness:** the docs live at a versioned-looking host (`postman-v1.guides.gov.sg`), and the search also surfaced a differently-prefixed `guide.postman.gov.sg/api-guide/...` path that redirects into it — consistent with a docs-site migration in progress. The content is still the authoritative Postman Guide (not a third-party mirror), but if this becomes load-bearing for an implementation decision, re-verify against the live page rather than trusting this snapshot indefinitely, and separately confirm `.zip` is on the accepted-type list.

## 2. Isomer's current integration (`apps/studio/src/lib/mail.ts`)

`sendMail` posts **JSON**, not multipart, to `https://api.postman.gov.sg/v1/transactional/email/send`:

```ts
const payload = {
  recipient: params.recipient,
  subject: params.subject,
  body: params.body,
  ...(cc.length > 0 && { cc }),
}
...
const response = await wretch("https://api.postman.gov.sg/v1/transactional/email/send")
  .auth(`Bearer ${env.POSTMAN_API_KEY}`)
  .post(payload)
  .res()
```
(`apps/studio/src/lib/mail.ts:44-56`)

There is no `attachments` field, no multipart body construction, and (per the FAQ requirement above) no evidence Isomer has a custom Postman sending domain configured — `docs/deploy/audit-log-exports.md` explicitly says the audit-export feature added "no new provider config" to the mail pipeline. Wiring in real attachments would require both a code change (multipart request) and an operational change (provisioning a custom domain with Postman support), not just a payload tweak.

## 3. Would a multi-site zip plausibly fit under 2 MB?

Scale inputs found in-repo:

- **"All sites" batch scope is unbounded in code.** `getAdminSiteIds` (`apps/studio/src/server/modules/site/site.service.ts:54-76`) resolves "all sites" for an Isomer Admin to **every row in the `Site` table, platform-wide** — no pagination, no cap, no sampling. `createAuditLogExportRequestsForSites` (`apps/studio/src/server/modules/audit/auditLogExport.service.ts:112-273`) then fans that out into one export-request row (and eventually one CSV) per site, explicitly designed to scale to "an Isomer Admin, every site on the platform" (comment at `auditLogExport.service.ts:104-111`). Neither file states a current site count — the code makes no assumption about how many that is, by design, which is exactly the property that makes "would N CSVs zip under 2 MB" scale-dependent rather than fixed.
- **Per-CSV size is unbounded and unmeasured at request time.** The export pipeline streams query results straight to S3 via cursor batches (`STREAM_CHUNK_SIZE = 500`, `auditLogExport.service.ts:333-336`) specifically because CSVs are not assumed to be small enough to buffer in memory. `AuditLog` rows (`packages/db/prisma/schema.prisma:302-316`) carry `metadata: Json` and `delta: Json` columns of unbounded size (diff payloads), so per-row CSV width is itself variable, not fixed-width.
- No file in this repo states an expected site count or expected monthly audit-log row count per site — I could not find a scale estimate to cite (checked `docs/`, `schema.prisma`, `tooling/*/README.md`; nothing quantifies "how many sites" or "how many rows/month" for the platform).

Given that, the honest answer is: **it depends entirely on current platform scale, which isn't documented anywhere I could find**, but the shape of the risk is clear either way:
- 2 MB (compressed) is very little headroom. A batch export designed to scale to "every site on the platform" with no cap is architecturally the wrong shape to fit inside a hard-coded 2 MB single-attachment ceiling — it might fit today with a handful of low-traffic sites, and then silently stop fitting the moment either site count or per-site audit volume grows, since nothing in the code enforces or even measures against that ceiling.
- CSV text compresses well (typically 5–10x with zip/deflate), which helps, but doesn't change the fact that the input side (site count × rows/site) is explicitly designed to be uncapped while the Postman limit is a hard, unconditional 2 MB.

**Conclusion for the design decision:** attachments are real, but they impose a tight, silently-enforced (413, not a graceful degrade) ceiling on a feature whose own code comments describe its scope as intentionally unbounded ("every site on the platform"). Treat 2 MB as a hard architectural constraint to design around (e.g. explicit size-checking + fallback before attempting to attach), not a limit to assume away.

## 4. Prior internal discussion of attachments vs. links

Searched via `git log --all --grep` for `attachment`, `postman`, `zip`, and `audit.*export` (case-insensitive) across the full history. Findings:

- **No commit ever discusses email attachments as an option for audit-log exports.** The only `attachment` hits in history are unrelated — the in-Studio `FileAttachment` React component (page-content file uploads: PDFs/images users attach to CMS pages), not anything about outbound email.
- **The one `postman` hit** (`f9507ebbc Feat/enhance logging for auth (#1833)`) is unrelated to email attachments — it's about auth logging.
- **`zip` hits** are unrelated to email delivery — a template-bundle build script (`eb25cbc86` extracts zip files for a benchmark) and this same wayfinder-mapping commit's own docs.
- The two ADRs (`docs/adr/0004-...` and `docs/adr/0006-...`) — both read in full — design the **single-site** link-delivery flow (presigned S3 URL → sealed download token) in detail, including an explicit "Considered options" section in ADR 0004. Neither ADR's considered-options list mentions attachments at all; the alternatives discussed are all still link-based (authenticated Studio route, Exports page with history). This reads as **attachments were never considered, not that they were considered and rejected** — there is no record of anyone evaluating Postman's attachment support for this feature before now.

## Files/URLs referenced

- `apps/studio/src/lib/mail.ts:1-56` — current JSON-only Postman integration, no attachment support
- `apps/studio/src/server/modules/audit/audit.router.ts:37-96` — batch ("allSites") request entry point
- `apps/studio/src/server/modules/audit/auditLogExport.service.ts:104-273` — fan-out to one export row per site, explicitly scoped to "every site on the platform"
- `apps/studio/src/server/modules/site/site.service.ts:54-76` — `getAdminSiteIds`, unbounded platform-wide site resolution for Isomer Admins
- `packages/db/prisma/schema.prisma:302-316` — `AuditLog` model (unbounded `Json` columns driving variable CSV row width)
- `docs/adr/0004-emailed-signed-url-delivery-for-audit-exports.md` — link-delivery rationale, no attachment consideration recorded
- `docs/adr/0006-sealed-download-tokens-for-audit-exports.md` — current link-delivery design, no attachment consideration recorded
- `docs/deploy/audit-log-exports.md` — confirms "no new provider config" was added to the mail pipeline for this feature
- https://postman-v1.guides.gov.sg/email-api-guide/programmatic-email-api/send-email-api/attachments — Postman Guide, attachment field/limits/error codes
- https://postman-v1.guides.gov.sg/email-api-guide/frequently-asked-questions — Postman Guide FAQ, custom-domain prerequisite for attachments
- https://github.com/opengovsg/postmangovsg-client — official Postman.gov.sg API client (corroborating, not primary)
