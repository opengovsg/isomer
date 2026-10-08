---
title: Capture PostHog events through the shared hooks
category: Analytics
type: best-practice
---

## Pattern

Fire client-side PostHog events through the shared capture hooks in
`apps/studio/src/hooks/` rather than calling `posthog.capture` directly from a
component with a hand-rolled `useEffect` + `useRef` fire-once guard:

- `usePostHogCaptureOnceReady` — fire once, the first time a condition is true.
- `usePostHogCaptureOncePerKey` — fire once per distinct key (funnel identity
  that changes without the component unmounting).
- `usePostHogOptionalStep` — funnel checkpoint that tags `skipped: true` when a
  step is bypassed, so "saw it and abandoned" is distinguishable from "never
  saw it".

A one-off `posthog.capture` in an event handler (e.g. a mutation `onSuccess`) is
fine — the hooks are for render-driven captures that must not double-count.

## Why

Render-driven captures double-count across re-renders unless guarded. Each
hand-rolled guard is a footgun (missing deps, stale closures) and the funnel
semantics drift between call sites. The shared hooks centralise the guard and
the `skipped` tagging so events stay consistent and comparable.

## Bad

```tsx
// manual fire-once guard, re-implemented per component
const fired = useRef(false)
useEffect(() => {
  if (!isReady || fired.current) return
  fired.current = true
  posthog.capture("unpublish_redirect_warning", { site_id })
}, [isReady, site_id])
```

## Good

```tsx
usePostHogOptionalStep({
  event: "unpublish_redirect_warning",
  isReady: !isPending && !isError,
  isBypassed: redirectCount === 0,
  properties: { site_id: siteId, redirect_count: redirectCount ?? 0 },
})
```

## How to detect

Grep for `posthog.capture(` inside a `useEffect` or paired with a `useRef`
fire-once flag in a component — reach for the shared hook instead. See
`apps/studio/src/features/editing-experience/components/UnpublishRedirectWarning.tsx`.
Each hook lives in its own file under `apps/studio/src/hooks/` (enforced by Oxlint `isomer/one-hook-per-file`).
