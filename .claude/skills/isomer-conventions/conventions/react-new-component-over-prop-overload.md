---
title: Prefer a new component over overloading props
category: React
type: smell
---

## Pattern

When a new use case needs a component to behave differently, prefer creating a
new component over piling more props onto the existing one. Adding flags and
single-purpose props to bend a component into a second job makes it a "component
in a trenchcoat" — really N components fused into one.

## Why

Overloaded components accrete conditional branches, become hard to read, and
couple unrelated callers: a change for one use case risks breaking the others.
Each prop multiplies the states to reason about and test. Splitting keeps each
component's intent clear and its blast radius small.

## Signals (what fires this smell)

- **Flag soup** — booleans piling up (`isCompact`, `hideThumbnail`,
  `showOwner`), each toggling some bit of layout/behaviour.
- **Single-caller props** — a prop that exists only to serve one usage site
  (e.g. `draggable` used only by the dashboard). Strong sign the component is
  straddling two distinct jobs.
- **All-or-nothing slot / render-prop** — a `renderX` or slot prop that each
  consumer either fully supplies or fully omits, and the supplied versions
  share nothing with each other. The component isn't being *configured*; it's
  hosting N different body implementations behind one seam — N components fused
  into a wrapper. Slots are the blessed fix *until they become the disguise*.

## Not a smell

- **Design-system primitives** (`Button`, `Input`, and similar low-level
  reusable building blocks) legitimately expose many configuration props.
  Don't flag these.
- **Shells with real shared machinery.** Before condemning a slot/render-prop,
  apply the litmus test: *when the slot is supplied, what's left in the
  component?* If it still owns substantial shared behaviour (drag-and-drop
  reorder, add/remove plumbing, data wiring, layout chrome), the slot is
  legitimate composition — splitting would duplicate that machinery. If only a
  thin wrapper remains, it should have been separate components.

## Yellow flags (call these out as fixables, non-blocking)

Some cases pass the litmus test but still carry warning signs. Don't wave them
through silently — surface them as *fixables*, not blockers:

- **Single-caller slots on a shared shell** (e.g. `listItemIcon`,
  `listItemSubtitle` supplied by only one of N consumers). Fine while the shell
  shares real chrome, but say so: if a third divergent consumer appears, push
  that decoration into the consumer via the existing render-prop seam rather
  than growing more optional slots.
- **A prop every consumer passes the same value for** isn't a configuration
  point — bake it into the component default and drop the prop.

## Bad

```tsx
// FileCard grew a flag per new context
<FileCard
  file={file}
  isCompact
  hideThumbnail
  showOwner={false}
  variant="search-result"
  onSelect={...}    // only the picker uses this
  draggable={false} // only the dashboard uses this
/>
```

## Good

```tsx
// Each use case is its own named component; shared parts are extracted
<SearchResultCard file={file} onSelect={...} />
<DashboardFileCard file={file} draggable />
// both compose a shared <FileCardShell> and/or useFileMeta() for common bits
```

## The fix

The principle is: **a genuinely new use case → a new component**. The mechanism
is the author's call — common options:

- Extract shared behaviour into a `useX()` hook so the new component reuses
  logic without inheriting props.
- Favour composition (children/slots, a shared shell component) over adding
  configuration props.
- Split into intent-named components (`SearchResultCard`, `DashboardFileCard`)
  rather than one configurable mega-component.

## How to detect

Scan component props for accumulating booleans and for props consumed by only
one caller. Look for `if (variant === ...)` / ternaries that swap whole layouts.
For slots and `renderX` props, check how each consumer uses them: if every
consumer either fully supplies or fully omits the slot (all-or-nothing) and the
supplied versions share nothing, apply the litmus test above. Flag props that
all consumers pass the same value for.
