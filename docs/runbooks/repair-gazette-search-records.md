# Runbook: Repair gazette Search Records

Incident-response steps for re-submitting gazette **Search Records** to the
shared egazette Algolia index using the `isomer-admin` CLI's "Repair gazette
search records" script
(`tooling/scripts/isomer-admin/apps/repair-gazette-search-records.ts`).

Terminology (see `CONTEXT.md` → Gazette search): a gazette produces one
**Search Record** per PDF text chunk; every record of one gazette shares the
same **Object Group** (its S3 object key). Design background: ADR 0002
(chunked records in the shared egazette Algolia index).

## When to use this

A batch of gazettes has missing or stale Search Records in Algolia — search
returns nothing (or stale text/classification) for gazettes that are
published on the site. Typical causes:

- The `schedule-push-document` pg-boss cron misfired or was failing for a
  window (check for `logger.error` entries tagged
  `cron:schedulePushDocumentJob`, e.g. `"Failed to process document"`).
- A redeploy happened mid-ingestion and dropped in-flight jobs.
- `ENABLE_SEARCHSG_GAZETTE_INGESTION` (GrowthBook) was off during the window
  the gazettes were published, so the cron's Algolia branch never ran for
  them.

Confirm before repairing: search the Algolia index for the affected
gazette's `objectGroup` (its S3 key, i.e. its `ref` page field without the
leading slash) and confirm no records — or obviously stale ones — come back.
Don't run this speculatively; it deletes the gazette's existing records
before re-submitting.

## Prerequisites

1. **Algolia dashboard check (per environment, one-time)** — `objectGroup`
   must be registered as `filterOnly(objectGroup)` under Index →
   Configuration → Facets (`attributesForFaceting`). The script's delete step
   filters on `objectGroup`; if this facet isn't registered, the delete
   **silently matches nothing** and you'll get duplicate/orphaned records
   instead of a clean repair. This is normally already set up in
   prod/staging (ADR 0002), but verify if running against a new environment.
2. AWS credentials for the gazette S3 bucket:
   ```sh
   aws sso login --profile <your-profile>
   ```
3. From `tooling/scripts`, copy `isomer-admin/.env.example` to
   `isomer-admin/.env` and fill in:
   - `DATABASE_URL`
   - `ALGOLIA_APP_ID`, `ALGOLIA_API_KEY`, `ALGOLIA_INDEX_NAME`
   - `S3_GAZETTE_BUCKET_NAME`, `S3_GAZETTE_DOMAIN_NAME`
4. If the database is behind a bastion, start the tunnel first:
   ```sh
   pnpm run db:connect   # from repo root; prompts for AWS profile per env
   ```
   Leave that session running — the script queries the database directly and
   prompts "Have you run `pnpm run db:connect`?", aborting if you answer no.

## Steps

1. Collect the resource IDs of the affected gazettes (Isomer `Resource.id`,
   not the egazette notification number). From `tooling/scripts`, write them
   to `./input/resource-ids.csv`, one per line (commas also
   accepted; header lines are ignored; leading zeros are stripped
   automatically).
2. Run the admin CLI:
   ```sh
   cd tooling/scripts
   pnpm run isomer-admin
   ```
3. Select **"Repair gazette search records"**.
4. Answer the prompts:
   - AWS profile (blank uses your current default credentials).
   - AWS region of the gazette S3 bucket (defaults to `ap-southeast-1`).
   - Confirm you've run `pnpm run db:connect` (answering no aborts the run).
5. The script resolves each ID and prints:
   - Any IDs it's skipping, with a reason (not found / not a gazette page /
     no publish timestamp).
   - The list of gazettes it will repair.
6. Confirm the re-submission prompt (`Re-submit Search Records for all N
gazette(s)?`). Answering no aborts with no changes made.
7. The script processes gazettes **serially** (Algolia is rate-limited).
   For each one it:
   - Fetches the live PDF from S3.
   - Rewrites the object's `Content-Disposition` so it downloads under the
     gazette's title instead of its raw S3 key (skipped if already correct).
   - Strips the `scheduledAt` object tag so the PDF stays publicly viewable
     (it does **not** re-apply the compliance object-lock retention — that's
     intentional, see the script's header comment).
   - Re-parses the PDF text and rebuilds Search Records.
   - Deletes the gazette's existing records by Object Group, then saves the
     fresh ones (delete-then-save makes this idempotent, including when the
     new PDF yields fewer chunks than before).
8. Read the per-gazette output and the final summary line (`N repaired, M
failed, out of T attempted`). Failures are logged inline and don't stop
   the run — re-run with just the failed IDs after investigating.

## Verification

- Search the Algolia index for each repaired gazette's `objectGroup`;
  confirm the record count matches the new chunk count and the `text`,
  `category`, `subCategory`, `publishDate`-family, and `fileUrl` fields look
  correct.
- Spot-check the gazette's search result on the live site.
- Confirm the gazette's PDF is publicly reachable at its `fileUrl` (the
  `scheduledAt` tag strip should have made it so).

## Troubleshooting

| Symptom                                                | Likely cause                                                                                                                |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| ID skipped: "resource not found"                       | Wrong ID, or resource was deleted.                                                                                          |
| ID skipped: "content is missing or not a gazette page" | Resource isn't a gazette (wrong `page.ref`/`page.category`/`page.tagged` shape), or has no content.                         |
| ID skipped: "no publish timestamp (scheduledAt) found" | Resource has neither `Resource.scheduledAt` nor a published `Version.publishedAt` — it likely isn't actually published yet. |
| "no Search Records built (empty PDF text); skipping"   | PDF parsed to empty text — check the PDF itself in S3 (corrupt upload, scanned image with no text layer).                   |
| Repair "succeeds" but records still missing/duplicated | Re-check the Algolia facet prerequisite above — `deleteBy` matches nothing if `objectGroup` isn't `filterOnly`.             |
| Script aborts at the `db:connect` prompt               | Tunnel isn't up — run `pnpm run db:connect` from repo root first, and leave it running.                                    |

## Related docs

- `tooling/scripts/isomer-admin/README.md` — one-paragraph script reference,
  alongside the rest of the isomer-admin CLI.
- `tooling/scripts/isomer-admin/apps/repair-gazette-search-records.ts` —
  source, with the same how-to-use steps in its header comment.
- `CONTEXT.md` — Gazette search terminology (Search Record, Object Group).
- `docs/adr/0002-chunked-records-in-shared-egazette-algolia-index.md` — why
  records are chunked and deleted by Object Group.
