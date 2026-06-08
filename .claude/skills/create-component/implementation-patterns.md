# Component Implementation Patterns

Reference for writing the `.tsx` implementation file for a new component.

---

## File structure

Every component lives in its own folder:

```
packages/components/src/templates/next/components/complex/{ComponentName}/
  {ComponentName}.tsx      # Component implementation
  index.ts                 # Barrel export
```

For components with multiple variants (see below), each variant gets its own file:

```
  {ComponentName}.tsx      # Switcher — reads variant, renders the right file
  {ComponentName}A.tsx     # Variant A implementation
  {ComponentName}B.tsx     # Variant B implementation
  index.ts
```

---

## Simple component

Reference: Accordion, Callout.

```tsx
import type { VariantProps } from "tailwind-variants"
import type { MyComponentProps as BaseMyComponentProps } from "~/interfaces/complex/MyComponent"
import { tv } from "~/lib/tv"
import { focusVisibleHighlight } from "~/utils/tailwind"

import { Prose } from "../../native/Prose"

// 1. Define styles with tv()
const createMyComponentStyles = tv({
  slots: {
    container: "...",
    title: "...",
    content: "...",
  },
})

const myComponentStyles = createMyComponentStyles()

// 2. Extend BaseProps with VariantProps so tv() variants can be passed as props
interface MyComponentProps
  extends BaseMyComponentProps,
    VariantProps<typeof createMyComponentStyles> {}

// 3. Destructure props from the schema type + site
export const MyComponent = ({ title, content, site }: MyComponentProps) => {
  return (
    <section className={myComponentStyles.container()}>
      <h2 className={myComponentStyles.title()}>{title}</h2>
      <Prose {...content} site={site} />
    </section>
  )
}
```

**Rules:**
- Import the props type as `BaseMyComponentProps` to avoid collision with the local interface extension.
- Always call `createMyComponentStyles()` outside the component body to avoid re-creating the styles on every render.
- Pass `site` down to any child component that needs it (Prose, LinkButton, etc.).

---

## Styling with `tv()`

`tv()` is the tailwind-variants wrapper from `~/lib/tv`. It handles class merging correctly with the Isomer custom merge config.

### Basic slot pattern

```tsx
const createStyles = tv({
  slots: {
    container: "flex flex-col gap-6",
    title: "prose-title-lg-medium text-base-content-strong",
    description: "prose-body-base text-base-content",
  },
})

const styles = createStyles()

// Usage
<div className={styles.container()}>
  <h2 className={styles.title()}>{title}</h2>
  <p className={styles.description()}>{description}</p>
</div>
```

### Slots with variants

```tsx
const createStyles = tv({
  slots: {
    container: "rounded-lg p-6",
    title: "prose-title-lg-medium",
  },
  variants: {
    tone: {
      neutral: { container: "bg-base-canvas-alt" },
      brand: { container: "bg-brand-canvas" },
    },
  },
  defaultVariants: {
    tone: "neutral",
  },
})

// Call with the variant value
const styles = createStyles({ tone: "brand" })
```

### Extending `focusVisibleHighlight`

Any element the user can focus (link, button, `<summary>`, `<details>`) must extend `focusVisibleHighlight`:

```tsx
import { focusVisibleHighlight } from "~/utils/tailwind"

const interactiveStyle = tv({
  extend: focusVisibleHighlight,
  base: "prose-headline-lg-medium flex items-center gap-3",
})
```

For elements inside a group where focus is on the parent, use `groupFocusVisibleHighlight` from the same file.

---

## Homepage components — `ComponentContent`

Components that appear on the Homepage layout must use `ComponentContent` on their outermost element. The layout injects `mx-auto max-w-screen-xl px-6 md:px-10` on all `.component-content` children.

```tsx
import { ComponentContent } from "~/templates/next/components/internal/customCssClass"

export const MyComponent = ({ title, site }: MyComponentProps) => {
  return (
    <section className={`${ComponentContent} py-12 md:py-16 first:pt-0`}>
      ...
    </section>
  )
}
```

Do not add `px-*` or `max-w-*` yourself. Do not use `ComponentContent` for content-page components — they inherit column constraints from the page grid.

---

## Nesting `Prose`

Many components accept a `content` or `details` field that is a prose schema. Pass it directly to `<Prose>` with spread:

```tsx
import { Prose } from "../../native/Prose"

export const MyComponent = ({ content, site }: MyComponentProps) => (
  <div>
    <Prose {...content} site={site} />
  </div>
)
```

Always pass `site` to `Prose`. It uses it for link resolution and theme context.

---

## Multi-variant component

Reference: Hero (5 variants).

When variants differ significantly in visual structure (not just a CSS swap), give each variant its own file. The main component file is a switcher.

**`MyComponent.tsx` — switcher**

```tsx
import type { MyComponentProps } from "~/interfaces/complex/MyComponent"
import { MY_COMPONENT_STYLE } from "~/interfaces/complex/MyComponent"

import { MyComponentA } from "./MyComponentA"
import { MyComponentB } from "./MyComponentB"

export const MyComponent = (props: MyComponentProps) => {
  switch (props.variant) {
    case MY_COMPONENT_STYLE.a:
      return <MyComponentA {...props} />
    case MY_COMPONENT_STYLE.b:
      return <MyComponentB {...props} />
    default:
      const _exhaustiveCheck: never = props.variant
      return null
  }
}
```

The `default: never` pattern ensures TypeScript errors if a new variant is added to the schema but not handled in the switch.

**`MyComponentA.tsx` — variant implementation**

```tsx
import type { MyComponentAProps } from "~/interfaces/complex/MyComponent"

export const MyComponentA = ({ title, subtitle, site }: MyComponentAProps) => {
  return (
    <div className="...">
      ...
    </div>
  )
}
```

Each variant file imports only its specific prop type.

---

## Layout-aware component

Reference: InfoCols, ContactInformation.

When a component renders differently on Homepage vs. content page, branch on the `layout` prop. The `layout` value comes from the page and is never stored in the block data.

```tsx
export const MyComponent = ({ layout, title, items, site }: MyComponentProps) => {
  const isHomepage = layout === "homepage"

  const styles = createStyles({ layout: isHomepage ? "homepage" : "default" })

  return (
    <section className={styles.container()}>
      ...
    </section>
  )
}
```

Alternatively, render a separate sub-component per layout if the structure diverges significantly (see `HomepageContactInformationUI` / `DefaultContactInformationUI`).

---

## `index.ts`

Always a single named re-export:

```ts
export { MyComponent } from "./MyComponent"
```

---

## Accessibility checklist

- Decorative icons: `aria-hidden` on every `<BiSomeIcon aria-hidden />`
- Focusable elements: extend `focusVisibleHighlight` via `tv()`
- Images: always require an `alt` field in the schema; pass it to `<img alt={alt} />`
- Heading hierarchy: do not skip levels. Most block-level components use `<h2>` for the block title and `<h3>` for item titles within.
- Semantic elements: `<section>` for major blocks, `<ul>`/`<li>` for lists of cards, `<details>`/`<summary>` for accordions, `<blockquote>` for quotes, `<figure>`/`<figcaption>` for captioned images.
