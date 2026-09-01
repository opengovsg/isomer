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

`public/0.1.0.json` is **generated** — it is gitignored and produced from `@opengovsg/isomer-components` at dev/build time via `scripts/generate-schema.ts`. The editor fetches it at runtime for JSON validation.

- `pnpm --filter playground dev` — runs `generate` automatically (`predev`)
- `pnpm --filter playground build` — runs `generate` before Vite bundles `public/`
- `pnpm --filter playground generate` — regenerate only

## Deployment

Vercel integration for this app will be wired to `apps/playground` after the move PR merges. Deployment is outside monorepo CI.
