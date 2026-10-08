# One custom hook per file

**Type:** best practice

## Rule

Each file exports at most one custom React hook (an identifier matching `use[A-Z]…`), including query modules such as `api.ts` files.

## Why

- Predictable imports (`import { useFoo } from "./useFoo"`).
- Smaller, reviewable units (PostHog helpers, form-builder hooks, etc.).
- Easier to find hook implementations via filename.

## Bad

```ts
// hooks/usePostHog.ts
export const usePostHogCaptureOnceReady = () => {}
export const usePostHogCaptureOncePerKey = () => {}
```

## Good

```ts
// hooks/usePostHogCaptureOnceReady.ts
export const usePostHogCaptureOnceReady = () => {}
```

## Detection

Oxlint rule `isomer/one-hook-per-file` from `eslint-plugin-isomer` (enabled in `@isomer/oxlint-config/base.json`).
