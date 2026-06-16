# @isomer/db

Shared database layer for the Isomer monorepo. Owns the Prisma schema, generated Kysely types, and the `createDb()` Kysely factory consumed by `apps/studio` and tooling scripts.

This package is being assembled progressively. See `docs/superpowers/specs/2026-06-02-extract-db-package-design.md` for the migration plan.
