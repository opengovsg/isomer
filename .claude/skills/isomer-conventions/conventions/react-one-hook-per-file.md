---
title: One custom hook per file
category: React
type: best-practice
---

## Pattern

Each custom hook lives in its own file, named after the hook it exports. Don't
group several hooks into one shared module (`useThingCapture.ts` exporting
three hooks). Shared types the hook needs stay in that file; a hook that
composes another imports it.

## Why

File name = export makes hooks discoverable and greppable, keeps diffs scoped to
the hook that changed, and keeps imports precise (consumers pull only what they
use). It matches the existing layout under `apps/studio/src/hooks/` and
`features/*/hooks/`, where every hook is its own file.

## Bad

```ts
// usePosthogCapture.ts — three hooks in one module
export const useCaptureOnceReady = ...
export const useCaptureOncePerKey = ...
export const useOptionalStep = ...
```

## Good

```ts
// usePostHogCaptureOnceReady.ts
export const usePostHogCaptureOnceReady = ...
// usePostHogCaptureOncePerKey.ts
export const usePostHogCaptureOncePerKey = ...
// usePostHogOptionalStep.ts  (imports usePostHogCaptureOnceReady)
export const usePostHogOptionalStep = ...
```

## How to detect

Grep for more than one `export const use`/`export function use` in a single file
under a `hooks/` directory. Co-locate each hook's test as
`__tests__/<hookName>.test.ts(x)`, one test file per hook.
