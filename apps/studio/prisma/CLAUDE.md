# Prisma + migrations (`apps/studio/prisma`)

The Prisma schema is the source of truth for the database. Migrations apply atomically against production via the `migrate:<env>` flow in the root `README.md`. Mistakes here are expensive — a bad migration can lock tables, drop data, or block deploys.

## Layout

```
prisma/
├── schema.prisma           # The schema. Generator targets: prisma-client-js, prisma-json-types-generator, prisma-kysely.
├── migrations/             # Prisma-managed migrations (timestamp-prefixed folders).
│   └── <ts>_<name>/migration.sql
├── custom/                 # Hand-authored SQL applied via the custom migration mechanism.
│   ├── install.ts          # Roller that splices custom SQL into the next migration.
│   └── migration.sql       # Accumulated custom statements awaiting the next dev migration.
├── generated/              # Kysely + Prisma JSON types (generated). Do not edit.
├── scripts/                # Ad-hoc data scripts (run manually, not by migrate).
├── seed.ts                 # Seed data for local dev.
└── types.ts                # JSON column TS types — referenced from schema via `prisma-json-types-generator`.
```

## Generators — what runs at `pnpm generate`

| Generator                     | Output                                       | Why                                           |
| ----------------------------- | -------------------------------------------- | --------------------------------------------- |
| `prisma-client-js`            | `node_modules/.prisma/client`                | Default Prisma client used by legacy queries. |
| `prisma-json-types-generator` | Types for `Json` columns                     | Reads from `prisma/types.ts`.                 |
| `prisma-kysely`               | `prisma/generated/generatedTypes.ts` + enums | Kysely DB types — preferred for new queries.  |

After any schema change, run `pnpm generate` and commit the regenerated `prisma/generated/` files.

## Workflow — adding a new migration

1. Edit `schema.prisma`.
2. From `apps/studio/`: `pnpm migrate:dev`. Name the migration descriptively (`add_<table>_<reason>`).
3. Inspect the generated `migration.sql` — Prisma sometimes generates destructive operations (drops, renames) when a non-destructive one would do.
4. Run `pnpm generate` to refresh the Kysely + JSON types.
5. Commit:
   - `prisma/schema.prisma`
   - `prisma/migrations/<ts>_<name>/migration.sql`
   - `prisma/generated/*`
6. Update `apps/studio/prisma/types.ts` if you added/changed a JSON column.

## Custom migrations

The `custom/` folder lets you ship hand-written SQL (triggers, partial indexes, RLS) that Prisma's introspection cannot express. Statements in `custom/migration.sql` get merged into the next Prisma migration by `custom/install.ts`.

Use this for:

- Triggers and stored procedures.
- Partial / expression indexes that Prisma can't express.
- Data backfills attached to a schema change.

Do **not** use this to bypass Prisma's tracked migration history. Every change must still land in a tracked migration folder.

## Rules

### Backward-compatible by default

- Migrations run before the new app code is deployed. The old code must still work against the new schema during the window.
- New required columns: add as nullable, backfill, then tighten in a follow-up migration.
- Column renames: add new, dual-write, drop old — three migrations, not one.
- Type changes: add a new column with the new type, migrate data, swap in code, drop old.

### One migration per PR

- A PR that touches the schema should land its migration alone, or as the only schema-change PR in a Graphite stack.
- Migrations that change schema in a non-backward-compatible way **must not** be stacked with app code changes that depend on them — they ship in their own PR and merge first.

### No destructive ops without explicit approval

- `DROP TABLE`, `DROP COLUMN`, `ALTER TYPE`, `TRUNCATE` require an explicit approving reviewer in the PR description.
- The agent must refuse to ship a destructive migration without a human picking the approach.

### Indexes

- New indexes on large tables should use `CREATE INDEX CONCURRENTLY` via a custom migration. Prisma's default `CREATE INDEX` will lock writes.
- An index that supports a new query path lands in the same PR as the query.

### JSON columns

- The TS type for each JSON column lives in `prisma/types.ts` and is picked up by `prisma-json-types-generator`. Update both together.

## Seeding

- `prisma/seed.ts` is for local dev only — it must be idempotent (re-running should produce the same state).
- Tests use their own setup, not the seed file.

## Scripts (`prisma/scripts/`)

- One-off data scripts (rename a column, normalise a value across rows) live here.
- Each script must be idempotent and dry-runnable.
- Scripts are **not** run by `migrate:<env>` — they're executed manually and recorded in the PR description.

## Anti-patterns the agent should refuse

- Combining a schema change with un-related app code in one migration PR.
- A `DROP COLUMN` / `DROP TABLE` in the same migration that adds its replacement.
- New required columns without a backfill + two-phase rollout.
- Editing files under `prisma/generated/` by hand.
- Skipping `pnpm generate` after a schema change.
- A non-idempotent script in `prisma/scripts/`.
