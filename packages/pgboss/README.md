# @isomer/pgboss

Internal wrapper around `pg-boss` for PostgreSQL-backed background job scheduling. Private package (not published).

## Key exports

- `createPgbossClient()` — creates and starts a PgBoss instance
- `getPgbossClient()` — singleton accessor (safe for Next.js hot reload)
- `registerPgbossJob()` — register a named cron job with a handler
- `stopAllPgbossJobs()` — graceful shutdown

Default timezone is `Asia/Singapore`.

## Commands

```bash
pnpm build        # dual CJS + ESM output to dist/
pnpm setup:test   # start Docker PostgreSQL + wait
pnpm test:unit    # requires PostgreSQL running first
pnpm test:watch
pnpm lint         # oxlint --type-aware
pnpm lint:fix
pnpm format       # oxfmt --check
pnpm format:fix
```

## Build system

Produces dual CJS (`dist/cjs/`) + ESM (`dist/esm/`) output. Path alias `~` maps to `./src`. `tsc-alias` resolves the alias after compilation.

Clean build artifacts with `git clean -xdf dist/` — do not commit `dist/`.

## Testing

Integration tests requiring a real PostgreSQL instance. Run `pnpm setup:test` first to start Docker Compose (PostgreSQL 15 on port 5431, user/pass `root`). Istanbul coverage (`pnpm test:unit -- --coverage`).

## Tooling

- **Linting**: `@isomer/oxlint-config` (Rust-based Oxlint, type-aware)
- **Formatting**: Oxfmt (Rust formatter)
- **TypeScript**: `@isomer/tsconfig` base config, strict mode, bundler module resolution
- **Turbo**: Build outputs cached under `dist/**`
