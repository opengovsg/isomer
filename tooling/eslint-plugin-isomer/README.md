# eslint-plugin-isomer

Custom lint rules for the Isomer monorepo, implemented as an **ESLint-compatible plugin** (the shape Oxlint’s [JS plugins](https://oxc.rs/docs/guide/usage/linter/js-plugins.html) expect). Source is **TypeScript** under `src/`; `pnpm build` emits plain JS to `dist/` for Oxlint’s JS plugin loader (Node does not load `.ts` from `node_modules` today). **ESLint is not installed** — only Oxlint runs in CI and locally; `@types/eslint` is only for rule typings.

Tests invoke **Oxlint** against fixture files under `tests/fixtures/`, not ESLint’s `RuleTester`.

## Rules

### `isomer/one-hook-per-file`

Any TypeScript file may export at most **one** custom React hook (identifiers matching `use[A-Z]…`).

Invalid:

```ts
// src/hooks/usePostHog.ts
export const usePostHogCaptureOnceReady = () => {}
export const usePostHogCaptureOncePerKey = () => {}
```

Valid:

```ts
// src/hooks/usePostHogCaptureOnceReady.ts
export const usePostHogCaptureOnceReady = () => {}
```

Non-exported `use*` helpers in the same file are allowed when only one hook is exported.

## Development

```bash
pnpm --filter eslint-plugin-isomer test
```
