---
name: create-component
description: Creates a new UI component in the Isomer Next monorepo — schema, implementation, stories, and Studio registration.
---

# Create Component

Before writing any code, read:
- `style-guide.md` — typography, colour, spacing decisions
- `schema-patterns.md` — TypeBox patterns, format hints, variant decision rule
- `implementation-patterns.md` — tv() slots, ComponentContent, Prose nesting, multi-variant switcher
- `story-patterns.md` — what stories to write and how

---

## Step 0A — Needs analysis

Before doing anything else, reason about the true underlying need behind the request — not just the literal words used.

**Check for existing components first.**
Read the live component inventory from the repo rather than relying on memory:

```bash
ls packages/components/src/interfaces/complex/
```

Also skim `packages/components/src/schemas/components.ts` to see what's registered. If any existing component already satisfies the need (even partially), stop here and tell the user which component to use and why. Do not proceed.

**If no existing component fits, derive the component spec:**

- **Name** — PascalCase, singular noun or noun phrase.
- **Short descriptor** — one sentence: what it is and when an editor would reach for it.
- **Props** — list every prop with its type, whether required or optional, and a short description of what it controls.
- **Layouts** — which layouts it may appear on (homepage, content pages, or both).
- **Edit context** — is it edited on a page (inline, via the PageEditor) or in Site Settings?

Present the full spec to the user and wait for explicit confirmation before moving on to Step 0B.

---

## Step 0B — Design options review

Generate **3 distinct design options** for the component. Options must differ in layout approach or information hierarchy — not just surface styling (colour, size, font weight). Superficial variants do not count.

For each option provide:

1. **Label** — a short name (e.g. "Side-by-side", "Card grid", "Stacked banner").
2. **Layout description** — plain English, 2–4 sentences. Describe how content is arranged spatially and how visual weight is distributed.
3. **Structural sketch** — a minimal JSX/TSX snippet showing only the DOM/component structure. Use existing design tokens and Tailwind classes from the project; do not invent new ones. Omit all logic and data-fetching.
4. **Trade-off** — one sentence on what this option is best at and what it sacrifices.

Present all three options and wait. The user may:

- **Accept one** → proceed to Step 0C.
- **Reject all** → generate 3 new distinct options (repeat this step).
- **Request a polish on one option** → revise that option only and present it again for confirmation, then proceed.

Do not write any production code until the user explicitly confirms a final option.

---

## Step 0C — Clarify before starting

**New component or variant of an existing one?**
See the decision rule in `schema-patterns.md`. If it's a variant, stop here and extend the existing schema and implementation instead.

**Which layouts does it appear on?**
Homepage, content pages, or both. Determines: whether `ComponentContent` is needed, whether a `layout` prop is needed, and which `ALLOWED_BLOCKS` sections to update.

**Does it have image fields?**
Use `generateImageSrcSchema` / `ImageSrcSchema` and `AltTextSchema` — never a plain `Type.String({ format: "image" })`. See Step 1.

---

## Step 1 — Schema

**Create** `packages/components/src/interfaces/complex/{ComponentName}.ts`

Follow the correct pattern from `schema-patterns.md` (simple, layout-aware, or discriminated variants).

**Image fields** — use the helpers from `./Image`, never a raw format string:

```ts
import { generateImageSrcSchema, ImageSrcSchema, AltTextSchema } from "./Image"

// Custom title:
imageSrc: generateImageSrcSchema({ title: "Background image" })

// Standard image, no customisation:
imageSrc: ImageSrcSchema

// Alt text — always paired with an image field, never optional:
imageAlt: AltTextSchema
```

**Export both** the schema and the props type:
```ts
export { MyComponentSchema, type MyComponentProps }
```

---

## Step 2 — Register the schema

**`packages/components/src/interfaces/complex/index.ts`**
```ts
export { MyComponentSchema, type MyComponentProps } from "./MyComponent"
```

**`packages/components/src/schemas/components.ts`** — add to `IsomerComplexComponentsMap`:
```ts
mycomponent: MyComponentSchema,
```

If the schema differs per layout, add a branch in `generateComponentSchema` following the Infobar pattern.

---

## Step 3 — Implement the component

**Create:**
```
packages/components/src/templates/next/components/complex/{ComponentName}/{ComponentName}.tsx
packages/components/src/templates/next/components/complex/{ComponentName}/index.ts
```

Follow `implementation-patterns.md`. Key decisions:
- Homepage component → add `ComponentContent` and correct section padding tier (see `style-guide.md`)
- Layout-aware → branch on `layout === "homepage"` or render separate sub-components per layout
- Multiple visual variants → switcher `{ComponentName}.tsx` + one file per variant

`index.ts` is always:
```ts
export { MyComponent } from "./MyComponent"
```

---

## Step 4 — Component stories

**Create** `{ComponentName}.stories.tsx` in the same folder.

Follow `story-patterns.md`. Minimum coverage:
- `Default` — realistic content
- `LongContent` — every string field near `maxLength`
- One story per schema variant
- One story per layout context (if layout-aware)
- `play()` story for any interactive state (expand, hover, focus)

---

## Step 5 — Layout story

Add the component to the `content` array of each relevant layout story. Follow placement rules in `story-patterns.md`.

- Homepage → `packages/components/src/templates/next/layouts/Homepage/Homepage.stories.tsx`
- Content page → `packages/components/src/templates/next/layouts/Content/Content.stories.tsx`

---

## Step 6 — Studio registration

Four edits, all in `apps/studio/src/`.

### 6a. Default block — `components/PageEditor/constants.ts`

Add to `DEFAULT_BLOCKS`. Every required field must have a realistic placeholder:

```ts
mycomponent: {
  type: "mycomponent",
  title: "This is the main title",
  subtitle: "This is an optional subtitle",
  items: [
    { title: "First item", description: "Description for the first item" },
    { title: "Second item", description: "Description for the second item" },
  ],
},
```

If the component has a `variant` discriminator, set the default variant explicitly.

### 6b. Block metadata — `components/PageEditor/constants.ts`

Add to `BLOCK_TO_META` (same file):

```ts
mycomponent: {
  label: "My Component",
  description: "One sentence on what this block is for and when to use it.",
  // imageSrc: omit — added later as a manual step after screenshot
},
```

`label` = how a content editor refers to it. `description` = use case, not visual appearance.

### 6c. Allowed blocks — `components/PageEditor/constants.ts`

Add to the correct section using this rule:

| Section | Use when |
|---------|----------|
| `"Basic content blocks"` in `CONTENT_ALLOWED_BLOCKS` | Flows within the reading column of a content page |
| `"Add a new section"` in `CONTENT_ALLOWED_BLOCKS` | Full-width block that breaks the page into a distinct section |
| `"Embed external content"` in `CONTENT_ALLOWED_BLOCKS` | Third-party embed or external service |
| `getHomepageAllowedBlocks` `"Add a new section"` | Homepage-only block |

If it appears on both Homepage and content pages, add to both.

### 6d. Icon — `features/editing-experience/constants.ts`

Add to `TYPE_TO_ICON`:

```ts
mycomponent: BiSomeIcon,
```

Always use `react-icons/bi`, **outline form** (not filled). Pick an icon that communicates the concept. If no standard icon represents the component's distinctive layout, create a custom SVG in `features/editing-experience/components/icons/{ComponentName}.tsx` — see existing icons for the pattern (schematic miniature of the layout, using `IconBaseProps`).

---

## Step 7 — Accessibility audit

After Steps 1–6 are complete (schema, implementation, stories, and Studio registration all done), invoke the accessibility auditor skill:

```
Skill("accessibility-auditor-skill")
```

The skill file lives at `.claude/skills/accessibility-auditor-skill/SKILL.md`. Follow its phase sequence exactly. Surface all findings to the user before making any changes. Do not apply any fix without explicit user approval for that specific fix.

---

## Checklist

- [ ] Schema created and exported from `interfaces/complex/index.ts`
- [ ] Schema registered in `schemas/components.ts`
- [ ] Image fields use `generateImageSrcSchema` / `ImageSrcSchema` + `AltTextSchema`
- [ ] Component `.tsx` and `index.ts` created
- [ ] Interactive elements extend `focusVisibleHighlight`
- [ ] Homepage component uses `ComponentContent`
- [ ] Stories written: Default, LongContent, per-variant, per-layout, interactive
- [ ] Component added to relevant layout story
- [ ] `DEFAULT_BLOCKS` entry added with realistic placeholder values
- [ ] `BLOCK_TO_META` entry added (no `imageSrc`)
- [ ] Added to correct `ALLOWED_BLOCKS` section(s)
- [ ] `TYPE_TO_ICON` entry added with outline `react-icons/bi` icon
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
