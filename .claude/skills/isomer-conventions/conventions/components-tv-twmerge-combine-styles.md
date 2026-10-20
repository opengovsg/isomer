---
title: Combine component styles with tv or twMerge in packages/components
category: Components
type: best-practice
---

## Pattern

In `packages/components`, when combining Tailwind classes — especially across
variants or with a `className` prop — use `tv` (from `~/lib/tv`) or `twMerge`
(from `~/lib/twMerge`) instead of inline conditional class strings. When there is
no variance to model and no classes to merge, a plain `className` string is
fine.

A single boolean variant is a normal `tv` use case. Prefer `tv` over inline
ternaries whenever variant logic appears in `className`.

## Why

Inline ternaries and template literals in `className` are hard to scan, easy to
get wrong when adding a third state, and bypass the repo's Tailwind merge
config. `tv` and `twMerge` keep variant logic in one place and resolve class
conflicts predictably. Overusing them for fully static classes adds noise without
benefit.

## Bad

```tsx
// Inline conditional — smell: variant logic buried in JSX
<div
  className={isPortrait ? "mx-auto w-full max-w-[20.3125rem]" : "w-full"}
/>

// Template-literal ternary — smell: same problem, harder to merge with className
<img
  className={`absolute left-0 h-full w-full rounded ${isContainNeeded ? "object-contain" : "object-cover"}`}
/>

// Redundant true/false pair — smell: one branch is just the default, declare it in base
const imageStyles = tv({
  base: "absolute left-0 h-full w-full rounded",
  variants: {
    contain: {
      true: "object-contain",
      false: "object-cover", // default belongs in base, not a false branch
    },
  },
})
```

## Good

```tsx
// tv with one boolean variant — fine; put the default in base, override in variants
const imageStyles = tv({
  base: "absolute left-0 h-full w-full rounded object-cover",
  variants: {
    contain: {
      true: "object-contain",
    },
  },
})

<img className={imageStyles({ contain: isContainNeeded })} />

// tv with multiple variant axes
const tableCellStyles = tv({
  base: "max-w-40 break-words border border-base-divider-medium px-4 py-3 align-top",
  variants: {
    isHeader: {
      true: "bg-base-canvas-backdrop [&_p]:prose-label-md-medium",
      false: "bg-base-canvas-alt [&_p]:prose-body-sm",
    },
  },
})

<td className={tableCellStyles({ isHeader: cell.type === "header" })} />

// twMerge when merging a fixed base with an optional className prop
<div className={twMerge("flex flex-wrap items-center gap-2", className)} />

// Plain string when there is no variance and nothing to merge
<nav className="flex flex-col gap-3 rounded-lg bg-base-canvas-alt p-6" />
```

## Not required

- A single static `className` with no conditionals and no `className` prop to
  merge.
- A one-off class with no variant logic — don't reach for `tv` just to wrap one
  string.

## How to detect

In `packages/components`, grep for `className=\{.*\?` or `className=\{\`` with
embedded `${... ? ... : ...}` — replace with `tv` or `twMerge`. When reviewing
`tv({`, check that defaults live in `base` (or `defaultVariants`) rather than
as a redundant `false` branch. Reserve plain `className` strings for fully static
markup with nothing to merge.
