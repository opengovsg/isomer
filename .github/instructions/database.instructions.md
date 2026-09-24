---
applyTo: "packages/db/prisma/schema.prisma,packages/db/prisma.config.ts,packages/db/prisma/migrations/**/*,packages/db/prisma/custom/**/*,packages/db/prisma/generate.cts,packages/db/src/generated/**/*,apps/studio/prisma/types.ts"
---

# Database review instructions

- Migrations run before new application code. Require the previous deployed
  application version and queued jobs to continue working after each migration
  in the pull request.
- Stage incompatible changes. Add required columns as nullable, backfill, and
  tighten later. Rename or type-change columns by adding the replacement,
  migrating or dual-writing, switching readers, and removing the old column in
  a later rollout.
- Flag `DROP TABLE`, `DROP COLUMN`, `ALTER TYPE`, `TRUNCATE`, destructive data
  rewrites, or Prisma-generated drop-and-add renames unless the pull request
  contains an explicit rollout plan and human approval.
- On large tables, require indexes to be created with
  `CREATE INDEX CONCURRENTLY` through the custom-migration workflow so writes
  are not locked.
- After `schema.prisma` changes, require the committed Kysely outputs under
  `packages/db/src/generated/` to be regenerated. Do not recommend hand edits
  to generated files.
- Keep JSON fields' `@kyselyType` annotations aligned with
  `apps/studio/prisma/types.ts`; report the exact generated or runtime type that
  becomes inconsistent.
