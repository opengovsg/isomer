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

## Why

Inline ternaries and template literals in `className` are hard to scan, easy to
get wrong when adding a third state, and bypass the repo's Tailwind merge
config. `tv` and `twMerge` keep variant logic in one place and resolve class
conflicts predictably. Overusing them for static or single-class cases adds
noise without benefit.

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

// tv with a single variant and no real branching — smell: ceremony without payoff
const imageStyles = tv({
  base: "absolute left-0 h-full w-full rounded",
  variants: {
    contain: {
      true: "object-contain",
      false: "object-cover",
    },
  },
})
```

Real examples: `packages/components/src/templates/next/components/complex/Video/Video.tsx:106`, `packages/components/src/templates/next/components/internal/BlogCard/BlogCard.tsx:45`.

## Good

```tsx
// tv when modelling real variants
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

Real examples: `packages/components/src/templates/next/components/native/Table/Table.tsx:22-29`, `packages/components/src/templates/next/components/internal/Tags/PlaintextTags.tsx:16`.

## Not required

- A single static `className` with no conditionals and no `className` prop to
  merge.
- A one-off class with no variant logic — don't reach for `tv` just to wrap one
  string.

## How to detect

In `packages/components`, grep for `className=\{.*\?` or `className=\{\`` with
embedded `${... ? ... : ...}`. When you see variant logic, check whether `tv` or
`twMerge` is the better fit. When you see `tv({` with only one boolean variant
and no extension/reuse, ask whether a plain ternary-free `tv` call or static
classes would be simpler — but still prefer `tv` over inline JSX conditionals
when there are two or more variant axes.
