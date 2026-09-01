# @isomer/db

Shared database layer for the Isomer monorepo. Owns the Prisma schema, generated Kysely types, and the `createDb()` Kysely factory consumed by `apps/studio` and tooling scripts.

See `prisma/CLAUDE.md` for the schema, migration, and generated-type workflow.
