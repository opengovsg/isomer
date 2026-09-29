# Studio database support (`apps/studio/prisma`)

This directory contains Studio-owned database support files. The Prisma schema,
migrations, custom migrations, and generated database types live in
`packages/db/`; see `packages/db/prisma/CLAUDE.md` before changing them.

## Layout

```text
prisma/
├── types.ts       # Precise PrismaJson types used by Studio
├── seed.ts        # Local-development seed data
└── scripts/       # Manually run data and administration scripts
```

## JSON-column types

- `types.ts` is the precise `PrismaJson` namespace declaration used by Studio.
  Keep it aligned with JSON fields and `/// @kyselyType(...)` annotations in
  `packages/db/prisma/schema.prisma`.
- `packages/db/src/prisma-json-types.d.ts` intentionally contains loose stubs
  so `@isomer/db` can type-check without depending on Studio or
  `@opengovsg/isomer-components`. Do not replace those stubs with Studio types.
- After changing a JSON-column shape or the database schema, run
  `pnpm --filter @isomer/db generate` from the repository root and commit the
  regenerated files under `packages/db/src/generated/`.

## Seeding

- `seed.ts` is for local development only. It must be idempotent: rerunning it
  should produce the same state.
- Tests use their own setup and fixtures, not the development seed.
- Run it from `apps/studio` with `pnpm db:seed` after local services and
  migrations are ready.

## One-off scripts

- Put manual data and administration scripts under `scripts/`.
- Make scripts idempotent and dry-runnable where the operation allows it.
- Scripts are not run by the migration workflow. Record the command, target
  environment, and outcome in the pull request or operational runbook.
- Pair with another engineer before running a script against production.
- Use the environment and tunnel instructions in `scripts/README.md`.

## Anti-patterns the agent should refuse

- Editing the database schema or migrations in this directory instead of
  `packages/db/prisma/`.
- Changing a JSON-column schema without updating `types.ts` and regenerating
  `packages/db/src/generated/`.
- Adding a non-idempotent seed or destructive one-off script without an
  explicit operational plan and human review.
