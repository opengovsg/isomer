# eslint-plugin-isomer

Custom ESLint rules for the Isomer monorepo. Rules are enforced through **Oxlint** via [JS plugins](https://oxc.rs/docs/guide/usage/linter/js-plugins.html) (`jsPlugins`), not a separate ESLint run.

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
