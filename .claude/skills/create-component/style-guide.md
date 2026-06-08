# Isomer Next Component Style Guide

Reference for typography, colour, and spacing decisions when implementing a new component. All classes are from the Isomer Next design system unless noted otherwise.

---

## Typography

All type classes follow the pattern `prose-{role}-{size}-{weight}`. Apply them as a single className — do not compose size and weight separately.

### Roles and when to use them

| Role | Class prefix | Use for |
|------|-------------|---------|
| Display | `prose-display-*` | Hero titles, page-level headlines. Never inside a card or inline component. |
| Title | `prose-title-*` | Section headings that group related content (e.g. the heading of an InfoCards or InfoCols block). |
| Headline | `prose-headline-*` | Sub-section labels, card titles, interactive element labels (accordion summary, tab label). |
| Body | `prose-body-*` | Multi-line readable text. Default for descriptive content. |
| Label | `prose-label-*` | Single-line supporting text: captions, tags, metadata, helper text. Never use for multi-line content. |

### Size and weight variants

**Display** — always semibold (weight is baked in, no weight suffix needed)
- `prose-display-xl` — 3rem → 4.25rem. Hero primary title only.
- `prose-display-lg` — 2.25rem → 3rem. Large feature heading.
- `prose-display-md` — 1.75rem → 2.25rem. Section feature heading.
- `prose-display-sm` — 1.5rem → 1.938rem.
- `prose-display-xs` — 1.25rem → 1.5rem. Smallest display size, for compact feature headings.

**Title**
- `prose-title-lg-medium` — 1.1875rem → 1.5rem. Default section title weight.
- `prose-title-lg-regular` — Same size, lighter weight. Use when the title sits alongside heavy content.
- `prose-title-md-semibold` — 1.0625rem → 1.25rem. Compact section title.
- `prose-title-md-medium` — Same size, medium weight.

**Headline**
- `prose-headline-lg-semibold` — 1.0625rem → 1.125rem. Strong emphasis within a section.
- `prose-headline-lg-medium` — Same size, medium weight. Default for interactive labels (accordion summary, nav items).
- `prose-headline-lg-regular` — Same size, normal weight. Callout body text.
- `prose-headline-base-semibold` — 0.9375rem → 1rem. Compact strong label.
- `prose-headline-base-medium` — Same size, medium weight.

**Body**
- `prose-body-base` — 1rem fixed. Default body text. Use for anything the user reads in paragraphs.
- `prose-body-sm` — 0.9375rem mobile → 0.875rem desktop. Secondary body text, supporting descriptions.

**Label**
- `prose-label-md-medium` — 0.875rem. Default label weight.
- `prose-label-md-regular` — 0.875rem, normal weight.
- `prose-label-sm-medium` — 0.75rem. Small metadata, tags, timestamps.
- `prose-label-sm-regular` — 0.75rem, normal weight.

### Decision guide

```
Is this the main title of the whole block/section?
  → prose-display-* or prose-title-lg-*

Is this a heading inside the block (e.g. a card title)?
  → prose-headline-lg-* or prose-title-md-*

Is this a label on an interactive element (button, tab, accordion)?
  → prose-headline-lg-medium

Is this body text the user reads?
  → prose-body-base (default), prose-body-sm (secondary/supporting)

Is this a caption, tag, or single-line metadata?
  → prose-label-md-* or prose-label-sm-*
```

### ⚠️ Deprecated classes — do not use
The following exist in the codebase but are deprecated. Do not use in new components:
`text-heading-01` through `text-heading-06`, `text-subheading-01`, `text-paragraph-01/02/03`, `text-caption-01`, `text-button-link-01`

---

## Colour

### System overview

There are four colour namespaces. Only `brand.*` changes per site — the rest are fixed.

| Namespace | Changes per site? | Use for |
|-----------|------------------|---------|
| `brand.*` | Yes (CSS vars) | Site-branded backgrounds, interactive elements that should match the site's identity |
| `base.*` | No | Neutral surfaces, text, dividers |
| `utility.*` | No | Feedback states (info, warning, alert), focus highlight |
| `link.*` | No | Hyperlinks only |

---

### `brand` tokens (site-configurable)

| Token | Tailwind class | Use for |
|-------|---------------|---------|
| `brand.canvas.DEFAULT` | `bg-brand-canvas` | Branded section background (full primary tint) |
| `brand.canvas.alt` | `bg-brand-canvas-alt` | Soft background that carries the primary tint without full saturation — use for alternating sections or cards that need a branded feel without dominating the layout |
| `brand.canvas.backdrop` | `bg-brand-canvas-backdrop` | Backdrop behind modals or overlays on branded surfaces |
| `brand.canvas.inverse` | `bg-brand-canvas-inverse` / `text-brand-canvas-inverse` | Primary brand colour — CTA buttons, active states, accent borders |
| `brand.interaction.DEFAULT` | `bg-brand-interaction` | Interactive element default state |
| `brand.interaction.hover` | `hover:bg-brand-interaction-hover` | Hover state for branded buttons |
| `brand.interaction.pressed` | `active:bg-brand-interaction-pressed` | Pressed state for branded buttons |

**Rule:** Use `brand.*` only when the element should visually respond to the site's colour scheme. Neutral components (dividers, body text, card backgrounds) should always use `base.*`.

---

### `base` tokens (fixed)

**Canvas — backgrounds**

| Token | Tailwind class | Use for |
|-------|---------------|---------|
| `base.canvas.DEFAULT` | `bg-base-canvas` | Default white component background |
| `base.canvas.alt` | `bg-base-canvas-alt` | Slightly off-white background — alternating sections, cards |
| `base.canvas.backdrop` | `bg-base-canvas-backdrop` | Light grey backdrop — modal overlays, sidebar backgrounds |
| `base.canvas.inverse.DEFAULT` | `bg-base-canvas-inverse` | Dark/inverted section background |
| `base.canvas.inverse.overlay` | `bg-base-canvas-inverse-overlay` | Semi-transparent dark overlay on images |

**Content — text**

| Token | Tailwind class | Use for |
|-------|---------------|---------|
| `base.content.strong` | `text-base-content-strong` | Primary text, headings, labels. Default for most text. |
| `base.content.DEFAULT` | `text-base-content` | Standard body text |
| `base.content.medium` | `text-base-content-medium` | Secondary body text, slightly lighter than DEFAULT |
| `base.content.light` | `text-base-content-subtle` | Captions, categories, article summaries, supporting text |
| `base.content.inverse.DEFAULT` | `text-base-content-inverse` | Text on dark/inverted backgrounds |
| `base.content.inverse.subtle` | `text-base-content-inverse-subtle` | Secondary text on dark backgrounds |

**Divider — borders and separators**

| Token | Tailwind class | Use for |
|-------|---------------|---------|
| `base.divider.subtle` | `border-base-divider-subtle` | Very light border — card outlines, subtle separators |
| `base.divider.medium` | `border-base-divider-medium` | Standard border — component edges, list separators |
| `base.divider.inverse` | `border-base-divider-inverse` | Border on dark backgrounds |

---

### `utility` tokens (feedback and accessibility)

| Token | Tailwind class | Use for |
|-------|---------------|---------|
| `utility.highlight` | `bg-utility-highlight` | **Focus ring background only.** Amber highlight applied by `focusVisibleHighlight`. Do not use for decorative purposes. |
| `utility.feedback.info.DEFAULT` | `text-utility-feedback-info` `border-utility-feedback-info` | Info state — borders, icons |
| `utility.feedback.info.subtle` | `bg-utility-feedback-info-subtle` | Info state background (Callout component) |
| `utility.feedback.info.faint` | `bg-utility-feedback-info-faint` | Very light info tint |
| `utility.feedback.warning.DEFAULT` | `text-utility-feedback-warning` | Warning text/icon |
| `utility.feedback.warning.subtle` | `bg-utility-feedback-warning-subtle` | Warning background |
| `utility.feedback.alert` | `text-utility-feedback-alert` | Error/destructive states |

---

### `link` tokens

| Token | Tailwind class | Use for |
|-------|---------------|---------|
| `link.DEFAULT` | `text-link` | Hyperlink default colour |
| `link.hover` | `hover:text-link-hover` | Hyperlink hover |
| `link.visited` | `visited:text-link-visited` | Visited link |

**Rule:** Only use `link.*` on `<a>` elements that are inline hyperlinks. Buttons and card-level links use `brand.*` or `base.*` interaction tokens.

---

### ⚠️ Do not use — deprecated tokens

The following exist in the codebase but must not be used in new components. They are top-level Tailwind config entries from the old token system: `canvas.*`, `content.*`, `hyperlink.*`, `interaction.*`, `divider.*`. If you see them in existing code, do not copy them.

---

## Spacing

### Component-level margin (between blocks on a page)

Use `[&:not(:first-child)]:mt-7` on the outermost element of a component. This creates consistent vertical rhythm between sibling blocks.

```tsx
// Preferred — composes better inside tv() slots
<div className="[&:not(:first-child)]:mt-7">

// Also valid
<section className="mt-7 first:mt-0">
```

---

### Section padding (full-width blocks on Homepage/landing)

The tier to use is based on visual weight — how much the component leads with a single punchy idea vs. how much content it carries.

| Tier | Value | Use for |
|------|-------|---------|
| Standard | `py-12 md:py-16` | Content-heavy blocks where the grid of items is the centrepiece (InfoCards, InfoCols, CollectionBlock, LogoCloud) |
| Prominent | `py-16 lg:py-24` | Blocks that lead with a single punchy statement — one headline, one CTA (Infobar, Blockquote) |
| Stats | `py-12 xs:py-24` | Number-led blocks only (KeyStatistics). Uses `xs` instead of `md` so the generous spacing kicks in earlier, giving the numbers room to breathe on small screens. |

---

### Horizontal page padding (`ComponentContent`)

Homepage-placed components must add `ComponentContent` to their outermost element. The layout applies `mx-auto max-w-screen-xl px-6 md:px-10` to all `.component-content` children automatically.

```tsx
import { ComponentContent } from "~/templates/next/components/internal/customCssClass"

<section className={`${ComponentContent} mt-7 first:mt-0`}>
```

Do not add `px-*` or `max-w-*` manually — the layout handles it. Content-page components (article body) do not use `ComponentContent`; they inherit the layout grid's column constraints.

---

### Internal spacing — heading container (title → subtitle/description)

The gap between a block's title and its subtitle or description depends on whether the heading is a full-width centrepiece or sits in a constrained column alongside content.

| Layout | Gap | Examples |
|--------|-----|---------|
| Full-width heading above a content grid | `gap-2.5` | InfoCards (default), InfoCols (content page), CollectionBlock |
| Full-width heading on a visually prominent or editorial block | `gap-6` | Infobar, Hero, InfoCards (bold/full-images variant) |
| Heading in a constrained column alongside content (side-by-side layout) | `gap-2.5` | InfoCols (homepage), ContactInformation (homepage, 2-method layout) |
| Full-width heading on a content-page component | `gap-6` | ContactInformation (default, content page) |

The rule: `gap-2.5` when the heading is compact relative to what follows (a dense card grid, a side-by-side column). `gap-6` when the heading is the visual centrepiece of the block.

---

### Internal spacing — section container (heading block → content grid)

| Content below the heading | Gap | Examples |
|--------------------------|-----|---------|
| Simple/flat content (logos, a single CTA, a contact grid on a content page) | `gap-9` | LogoCloud, Infobar, ContactInformation default |
| Dense or layered content grid (icon columns, article cards, contact methods on homepage) | `gap-12` | InfoCols, CollectionBlock, ContactInformation homepage |

---

### Internal spacing — micro gaps within elements

| Context | Value |
|---------|-------|
| Icon + label, badge + text | `gap-1.5` – `gap-2` |
| Stacked label/value pairs | `gap-3` |
| Card content stack (title + description + meta) | `gap-3` – `gap-5` |
| Card grid | `gap-9` – `gap-12` (matches section container tier above) |

---

### ⚠️ Known deviation — InfoCards heading-to-grid spacing

InfoCards uses `pb-8 md:pb-12` on the `headingContainer` to create the gap to the card grid, rather than `gap-*` on the section container. This is a known workaround (noted in the code as `// temp`). Do not copy this pattern in new components — use `gap-*` on the section container instead.

---

## Accessibility

### Focus styles — interactive elements

Any component with a focusable interactive element (link, button, `<summary>`, `<details>`) must use `focusVisibleHighlight` from `~/utils/tailwind`.

```tsx
import { tv } from "~/lib/tv"
import { focusVisibleHighlight } from "~/utils/tailwind"

const myStyle = tv({
  extend: focusVisibleHighlight,
  base: "...",
})
```

This applies the standard amber highlight + shadow focus ring on `:focus-visible`. Do not implement custom focus styles.

For elements inside a group where the parent holds focus, use `groupFocusVisibleHighlight` from the same file.

### Decorative icons

Use bi- icons for decorative icons. Use outline variant instead of filled.

All decorative icons (visual affordances, not meaningful content) must have `aria-hidden`:

```tsx
<BiChevronDown aria-hidden />
```

### Semantic HTML

Prefer semantic elements over styled divs:
- `<details>` / `<summary>` for expandable content (accordion)
- `<blockquote>` for quotes
- `<section>` for major content blocks with a heading
- `<ul>` / `<ol>` for lists of items (cards, statistics)
- `<figure>` / `<figcaption>` for images with captions
