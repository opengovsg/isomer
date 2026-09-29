# Prisma schema and migrations (`packages/db/prisma`)

The Prisma schema is the source of truth for the database. Migrations run
before new application code is deployed, so mistakes here can lock tables,
drop data, or make the old application version fail during rollout.

## Layout

```text
packages/db/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Prisma-managed, timestamped migrations
│   ├── custom/             # Hand-authored SQL and its installer
│   ├── generate.cts        # Post-processes generated Kysely types
│   └── generated/prisma/   # Generated Prisma client; gitignored
└── src/
    ├── generated/          # Generated Kysely types and enums; committed
    └── prisma-json-types.d.ts
```

Studio's precise JSON-column types, development seed, and one-off data scripts
remain under `apps/studio/prisma/`; see that directory's `CLAUDE.md` when they
are part of the change.

## Generated outputs

Running `pnpm --filter @isomer/db generate` produces:

| Generator / step      | Output                                                                        | Commit?        |
| --------------------- | ----------------------------------------------------------------------------- | -------------- |
| Prisma client         | `packages/db/prisma/generated/prisma/`                                        | No; gitignored |
| `prisma-kysely`       | `packages/db/src/generated/generatedTypes.ts` and `generatedEnums.ts`         | Yes            |
| `prisma/generate.cts` | `packages/db/src/generated/selectableTypes.ts` and unsupported-column patches | Yes            |

Do not edit generated files by hand. After every schema change, regenerate and
commit all changes under `packages/db/src/generated/`.

## Adding a migration

1. Edit `packages/db/prisma/schema.prisma`.
2. From `apps/studio`, run `pnpm migrate:dev` and give the migration a
   descriptive name. Equivalently, run the filtered `@isomer/db` migration
   command from the repository root.
3. Inspect the generated `migration.sql`; Prisma may express a rename as a
   destructive drop and add.
4. Run `pnpm --filter @isomer/db generate` from the repository root.
5. Commit the schema, the new migration directory, and changes under
   `packages/db/src/generated/`.
6. If a JSON column changed, update `apps/studio/prisma/types.ts` in the same
   change.

## Custom migrations

Use `packages/db/prisma/custom/migration.sql` for database objects Prisma cannot
express, such as triggers, stored procedures, partial indexes, or data
backfills tied to a schema change. Run
`pnpm --filter @isomer/db migrate:custom` to copy new statements into a tracked
timestamped migration.

Do not use custom SQL to bypass Prisma's migration history. Every production
change must still be present under `packages/db/prisma/migrations/`.

## Rules

### Backward-compatible by default

- The old application version must continue to work after the migration runs.
- Add required columns as nullable, backfill them, then tighten the constraint
  in a follow-up migration.
- Rename columns by adding the replacement, dual-writing or migrating data,
  switching readers, and dropping the old column only after rollout.
- Change a column type by adding a new column and migrating callers; do not
  rewrite it in place when old code or queued jobs can still use it.

### Isolate schema changes

- Keep one schema-change concern per pull request.
- A non-backward-compatible migration must land separately before application
  code that depends on it; do not hide the dependency inside a Graphite stack.

### Destructive operations require explicit approval

- `DROP TABLE`, `DROP COLUMN`, `ALTER TYPE`, and `TRUNCATE` require explicit
  human approval recorded in the pull request.
- Do not combine removal of an old field with addition of its replacement in a
  single rollout migration.

### Indexes

- Create indexes on large tables with `CREATE INDEX CONCURRENTLY` through a
  custom migration so writes are not locked.
- Land an index that supports a new query path with that query change.

### JSON columns

- Keep each JSON field's `/// @kyselyType(...)` annotation in `schema.prisma`
  aligned with `apps/studio/prisma/types.ts`.
- Regenerate the committed Kysely types after changing either side of the
  contract.

## Anti-patterns the agent should refuse

- A destructive migration without an explicit rollout plan and approval.
- A new required column without a backfill and staged rollout.
- Hand-editing files under `packages/db/src/generated/` or
  `packages/db/prisma/generated/`.
- Skipping generation after a schema change.
- Putting Studio seed data or one-off administration scripts in `packages/db`.
