---
status: accepted
---

# Audit Log Exports live in a dedicated private studio assets bucket, not the website assets bucket

Audit-log CSV exports are written to a **dedicated private S3 bucket** for Studio-generated artifacts (provisioned in `isomer-next-infra` as `{name}-studio-assets`, resolved at runtime via `S3_STUDIO_ASSETS_BUCKET_NAME` from the `/s3/studio-assets/bucket` SSM parameter), under the `audit-log-exports/{siteId}/{requestId}/` key prefix. The original implementation reused the public-facing website assets bucket with only the key prefix as an isolation boundary; that choice was never documented and this ADR replaces it.

## Why not the website assets bucket

The assets bucket is *designed to be publicly served*, so PII CSVs placed in it inherit machinery meant for website assets, and each piece needs (and stays needing) a prefix-scoped patch:

- **Public access point + CloudFront.** Any object GuardDuty tags `NO_THREATS_FOUND` is fetchable unauthenticated through the public assets domain. Exports would have been public-with-unguessable-key for their whole lifetime, bypassing the sealed-token download route (ADR 0006), unless an explicit prefix `Deny` was maintained on the access point policy forever.
- **Backups outlive the expiry.** The bucket syncs daily to a GCS backup bucket (retained indefinitely) and, in prod, is in AWS Backup's daily plan. "Deleted after 7 days" would be false in two other stores; AWS Backup cannot exclude a prefix at all.
- **Versioning + Object Lock.** Lifecycle expiration on a versioned bucket only inserts a delete marker; actually deleting the data needs a companion noncurrent-version rule and still leaves delete markers (whose keys embed `siteId`/`requestId`) behind forever.
- **Unrelated machinery fires on every export.** The bucket-wide `ObjectCreated` trigger invokes the file-compression Lambda on each CSV, and browser-upload CORS rules apply to a prefix that never sees browser uploads.

## The dedicated bucket

No access point, no CDN, no CORS, no backup strategy, **unversioned** — so the 7-day lifecycle rule (`expire-audit-log-exports`, prefix-scoped so future artifact types can set their own retention) genuinely deletes the personal data, with no delete markers and no copies in backup stores. The ECS task role gets `ListBucket`/`GetObject`/`PutObject` on it (`ListBucket` so a `HeadObject` on a missing key is a 404, not a 403 — the reuse path distinguishes absent artifacts from errors).

## Consequences

- The data-at-rest lifecycle gap flagged in ADR 0004/0006 is closed: exports are deleted 7 days after upload, everywhere.
- The 7-day expiry must stay comfortably above `AUDIT_LOG_EXPORT_URL_EXPIRY_DAYS` (3): a request row's Download Window anchors to its `completedAt`, and Complete-Artifact reuse (ADR 0005) can fulfil a fresh request from a CSV up to 7 days old — reuse late in an artifact's life can still mint a link that outlives the object. Bounding reuse eligibility by object age remains an open follow-up.
- Deploy ordering: the infra change (bucket + SSM parameter) must deploy before the task-definition change that reads `/s3/studio-assets/bucket`, or ECS tasks fail to resolve the secret at startup.
- Exports are no longer GuardDuty-scanned. They are generated server-side from the database, never from user uploads, so nothing is lost.
- Preview environments (R2) are unaffected: the R2 client ignores the AWS bucket entirely, and preview exports remain out of scope.
