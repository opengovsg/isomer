# Deploy checklist: audit-log exports

Everything needed to take the audit-log-export stack (PRs #2608 → #2912) live in
an environment. Work top to bottom; the ordering between sections is load-bearing.

Design references: ADR 0005 (Complete-Artifact reuse), ADR 0006 (sealed download
tokens), ADR 0007 (dedicated studio assets bucket).

## 1. Infra first (isomer-next-infra) — must deploy BEFORE the app

- [ ] Deploy the `studio-assets` bucket change (commit `feat: dedicated private
      bucket for Studio-generated artifacts`) via `pulumi up` in the target
      stack. It creates:
  - `{name}-studio-assets` private bucket (unversioned, no backups, no access
    point) with the `expire-audit-log-exports` lifecycle rule (7 days, prefix
    `audit-log-exports/`)
  - ECS task-role policy: `s3:ListBucket` on the bucket, `s3:GetObject` +
    `s3:PutObject` on its objects
  - SSM parameter `/s3/studio-assets/bucket`
- [ ] Verify the SSM parameter exists in the target env before the app deploy —
      the new task definition reads it as a secret; ECS tasks **fail to start**
      if it is unresolvable.

## 2. Database migrations (run in order, before the app code)

- [ ] `20260630031102_add_audit_log_export_request` — enums
      `AuditLogExportReportType` / `AuditLogExportStatus`, the
      `AuditLogExportRequest` table (Postgres `daterange` column; FKs to
      Site/User `ON DELETE RESTRICT`), status index, and a **partial unique
      index** (`WHERE "status" IN ('Pending','Processing')`) written as raw
      SQL. `prisma migrate dev` reports *expected* drift against the schema
      DSL for this index — documented in `schema.prisma`; do not "fix" it.
- [ ] `20260717000000_add_audit_log_export_create_event` — `ALTER TYPE
      "AuditLogEvent" ADD VALUE 'AuditLogExportCreate'`. Enum-value adds cannot
      run inside a transaction block on some Postgres versions; confirm the
      migration runner handles it the same way as prior enum migrations.

## 3. Env vars

| Var | Status | Notes |
| --- | --- | --- |
| `S3_STUDIO_ASSETS_BUCKET_NAME` | **NEW** | Mapped in `.aws/deploy/task-definition.json` from SSM `/s3/studio-assets/bucket`. Optional in `env.mjs` by design (local dev boots without it) but required wherever exports run — `getStudioAssetsBucketName()` throws at first use. Web and worker share the task definition, so one mapping covers both. |
| `SESSION_SECRET` | existing, now load-bearing | Also seals Download Tokens via the shared password map (`server/modules/auth/session.ts`). Rotating in a way that drops old key versions kills all outstanding (≤3-day) download links — acceptable during leak response, otherwise rotate additively (ADR 0006). |
| `NEXT_PUBLIC_APP_URL` | existing, now load-bearing | Emailed download links are built from it; must be the correct public origin in every env that sends export emails. Build-time (`NEXT_PUBLIC_*`), so it is baked into the image, not read from SSM at runtime. |
| `NEXT_PUBLIC_S3_REGION` | existing | Region for the S3 client that uploads/presigns against the new bucket. Already set everywhere the assets flow works. |
| `POSTMAN_API_KEY` | existing | Export emails ride the existing `sendMail` pipeline; no new provider config. |

No other env vars were added by the stack (verified against the `env.mjs` diff).

## 4. Platform pieces

- [ ] **pg-boss cron** `audit-log-export` (`server/cron/jobs/auditLogExportJob.ts`):
      every minute, `retryLimit: 3`, singleton. Runs in-process on the existing
      pg-boss/Postgres setup — nothing to provision, but confirm the cron
      worker process runs in the target env. Added load per sweep: claims ≤20
      Pending rows; each does DB reads + S3 upload + email.
- [ ] **Unauthenticated routes** `/api/audit-log-exports/download` and
      `/audit-log-exports/expired` (by design, ADR 0006). Studio has no AWS WAF
      (Cloudflare-proxied ALB, verified in isomer-next-infra), but the
      Cloudflare zone is managed outside the repo — confirm no zone-level
      rule (bot fight mode, managed challenge on `/api/*`) challenges bare
      GETs from email clicks.
- [ ] **Email templates**: two new templates through the existing pipeline.

## 5. Post-deploy smoke test (staging, then prod)

- [ ] Request an export end-to-end as a Site Admin.
- [ ] Confirm the cron picks it up (row `Pending` → `Processing` → `Done`) and
      the CSV lands under `audit-log-exports/{siteId}/{requestId}/` in the
      **studio-assets** bucket (not the website assets bucket).
- [ ] Click the emailed link → 302 to a presigned URL → CSV downloads.
- [ ] Tamper with the token / wait out the window → the expired page, not an
      S3 error.
- [ ] Confirm an `AuditLogExportCreate` audit event was written.

## 6. Known follow-ups (not blockers, tracked here so they aren't lost)

- **Reuse window vs object expiry** (ADR 0007): Complete-Artifact reuse can
  fulfil a fresh request from a CSV up to 7 days old, minting a link that
  outlives the object (raw S3 error instead of the expired page). Fix is
  app-side: bound reuse eligibility by object age, or HEAD-and-fallback in the
  download route.
- **Dedupe-predicate follow-up** promised on #2605 — still unfiled.
- Old plan to lifecycle-expire exports inside the website assets bucket is
  **obsolete** — superseded by the dedicated bucket (ADR 0007).
