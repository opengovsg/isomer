# Playground

A Vite app for editing and previewing Isomer page schemas. It provides a live JSON editor alongside a rendered preview powered by `@opengovsg/isomer-components`.

## Development

From the repository root:

```bash
pnpm --filter playground dev
```

Root `pnpm dev` starts Studio only. Use the command above to run the playground.

## Build

```bash
pnpm --filter playground build
```

## Lint & format

Uses the monorepo's **oxlint** and **oxfmt** toolchain (not ESLint or Prettier):

```bash
pnpm --filter playground lint
pnpm --filter playground format
pnpm --filter playground format:fix
```

## Schema generation

`scripts/generate-schema.ts` imports the schema from `@opengovsg/isomer-components` and writes `public/0.1.0.json`. The editor loads that file at runtime for JSON validation. Run `pnpm --filter playground generate` to regenerate it (also runs automatically as part of `build`). Generated files under `public/` are formatted with oxfmt.

## Deployment

Vercel integration for this app will be wired to `apps/playground` after the move PR merges. Deployment is outside monorepo CI.
