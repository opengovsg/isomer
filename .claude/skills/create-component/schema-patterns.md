# Isomer Next Schema Patterns

Reference for writing TypeBox schemas for new components. Every component needs a schema — it drives both TypeScript types and the Studio editing UI via JsonForms.

---

## Imports

```ts
import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
```

For layout-aware components, also import:
```ts
import type { IsomerPageLayoutType } from "~/types"
```

For validation utilities:
```ts
import { LINK_HREF_PATTERN, NON_EMPTY_STRING_REGEX } from "~/utils/validation"
```

---

## Pattern 1 — Simple component

Use this for components with no variants. Accordion and Callout are the reference implementations.

```ts
export const AccordionSchema = Type.Object(
  {
    type: Type.Literal("accordion", { default: "accordion" }),
    summary: Type.String({
      title: "Title",
    }),
    details: AccordionProseSchema,
  },
  { title: "Accordion" },
)

export type AccordionProps = Static<typeof AccordionSchema> & {
  site: IsomerSiteProps
}
```

**Rules:**
- `type` is always a `Type.Literal` with a `default` matching the string. This is the block type identifier used by the page blob.
- The second argument to `Type.Object` is the schema title. This appears as the heading in the Studio editor drawer.
- Always export both `{Name}Schema` and `type {Name}Props`.
- Props type is always `Static<typeof {Name}Schema> & { site: IsomerSiteProps }`.

---

## Pattern 2 — Component with layout variant

Use this when the component appears on both the homepage and content pages with the same props but different visual treatment. InfoCols is the reference.

**In the schema file** — no change needed. The schema is identical across layouts. Add `layout` to the props type:

```ts
export const InfoColsSchema = Type.Object(
  {
    type: Type.Literal("infocols", { default: "infocols" }),
    title: Type.String({ title: "Title" }),
    subtitle: Type.Optional(Type.String({ title: "Description" })),
    infoBoxes: Type.Array(InfoBoxSchema, {
      title: "Content",
      minItems: 1,
      maxItems: 6,
    }),
  },
  { title: "Columns of text" },
)

export type InfoColsProps = Static<typeof InfoColsSchema> & {
  layout: IsomerPageLayoutType  // passed by the page, not stored in the block
  site: IsomerSiteProps
}
```

**In `schemas/components.ts`** — if the component needs a different schema per layout (e.g. different field visibility), register both schemas and add a branch in `generateComponentSchema`. See how Infobar handles this. If the schema is the same across layouts, register once and rely on the `layout` prop in the component implementation.

**Rule:** Use a layout prop when the use case and fields are the same but the visual design adapts. Do not create a separate component just because the spacing or typography changes between homepage and content page contexts.

---

## Pattern 3 — Component with discriminated variants

Use this when the component has meaningfully different field sets depending on a user-selected style. InfoCards is the reference (cards with images, without images, full images). Hero is the reference for more complex grouping.

### 3a. Base + discriminated union (InfoCards pattern)

```ts
// 1. Export variant name constants
export const CARDS_WITHOUT_IMAGES = "cardsWithoutImages"
export const CARDS_WITH_IMAGES = "cardsWithImages"

// 2. Define the shared base schema
const MyComponentBaseSchema = Type.Object({
  type: Type.Literal("mycomponent", { default: "mycomponent" }),
  title: Type.String({ title: "Title" }),
  // ... fields common to all variants
})

// 3. Define per-variant schemas with a `variant` literal
const VariantASchema = Type.Object(
  {
    variant: Type.Literal(CARDS_WITH_IMAGES, { default: CARDS_WITH_IMAGES }),
    items: Type.Array(ItemWithImageSchema, { title: "Items", minItems: 1 }),
  },
  { title: "With images" },
)

const VariantBSchema = Type.Object(
  {
    variant: Type.Literal(CARDS_WITHOUT_IMAGES, { default: CARDS_WITHOUT_IMAGES }),
    items: Type.Array(ItemNoImageSchema, { title: "Items", minItems: 1 }),
  },
  { title: "Without images" },
)

// 4. Assemble with Type.Intersect + Type.Unsafe
// Type.Union generates anyOf — AJV discriminator requires oneOf. Always use Type.Unsafe here.
export const MyComponentSchema = Type.Intersect(
  [
    MyComponentBaseSchema,
    Type.Unsafe<
      | Static<typeof VariantASchema>
      | Static<typeof VariantBSchema>
    >({
      oneOf: [VariantASchema, VariantBSchema],
      discriminator: { propertyName: "variant" },
      format: ARRAY_RADIO_FORMAT,  // renders as a radio group in Studio
      title: "Style",
    }),
  ],
  { title: "My Component" },
)

// 5. Export per-variant prop types plus the union
export type MyComponentProps = Static<typeof MyComponentSchema> & {
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
}
```

Import `ARRAY_RADIO_FORMAT` from `../format`.

**Critical:** Always use `Type.Unsafe` with `oneOf` for the discriminated union — never `Type.Union`. `Type.Union` emits `anyOf`, which AJV's discriminator plugin does not support. This will silently break validation.

### 3b. Composite variants with groups (Hero pattern)

Use this when variants share most fields but need them organised into collapsible groups in the Studio drawer.

```ts
const GROUPINGS = {
  CONTENT: {
    label: "Content",
    fields: ["title", "subtitle"],
  },
  PRIMARY_CTA: {
    label: "Primary Call-to-Action",
    fields: ["buttonLabel", "buttonUrl"],
  },
} as const

const VariantASchema = Type.Composite(
  [
    Type.Object({
      variant: Type.Literal("variantA", { default: "variantA" }),
      backgroundUrl: BackgroundUrlSchema,
    }),
    BaseSchema,
    CtaSchema,
  ],
  {
    title: "Variant A label shown in the radio picker",
    groups: [GROUPINGS.CONTENT, GROUPINGS.PRIMARY_CTA],
  },
)

export const MySchema = Type.Intersect(
  [
    Type.Union(
      [VariantASchema, VariantBSchema],
      {
        title: "Style",
        format: ARRAY_RADIO_FORMAT,
      },
    ),
  ],
  { title: "My Component" },
)
```

`groups` is metadata consumed by the Studio drawer to render fields under collapsible section headings. Each entry has a `label` (the heading) and `fields` (array of field names from the schema). Fields not listed in any group appear ungrouped at the top.

Use `groups` when a variant has more than ~5 fields and some are logically related (e.g. primary CTA fields, secondary CTA fields, background options).

---

## Field reference — format hints

The `format` property on a field controls which custom control renders in Studio. These are the supported values:

| `format` value | Studio control | Use for |
|---|---|---|
| _(omitted)_ | Text input | Short strings |
| `"textarea"` | Multiline text input | Descriptions, subtitles, longer text |
| `"link"` | Link picker (internal + external) | URLs that the user should browse to |
| `"prefill-link"` | Link picker with prefill support | Card URLs in infocards-style blocks |
| `"image"` | Image upload picker | `src` fields for user-uploaded images |
| `"color-picker"` | Hex colour input | Brand colour overrides |
| `"hidden"` | Not rendered in Studio | Internal fields, anchor IDs, deprecated fields |
| `"prose"` | TipTap rich text editor | Nested prose/rich content |
| `ARRAY_RADIO_FORMAT` | Radio group | Discriminator variant picker |

```ts
// Examples
subtitle: Type.Optional(Type.String({ title: "Description", format: "textarea" }))
buttonUrl: Type.Optional(Type.String({ title: "Link destination", format: "link" }))
imageSrc: Type.String({ title: "Image", format: "image" })
anchorId: Type.Optional(Type.String({ title: "Anchor ID", format: "hidden" }))
```

---

## Field reference — common patterns

**Non-empty string validation**
```ts
import { NON_EMPTY_STRING_REGEX } from "~/utils/validation"

title: Type.String({
  title: "Title",
  pattern: NON_EMPTY_STRING_REGEX,
  errorMessage: { pattern: "cannot be empty or contain only spaces" },
})
```

**Link URL**
```ts
import { LINK_HREF_PATTERN } from "~/utils/validation"

buttonUrl: Type.Optional(Type.String({
  title: "Button destination",
  description: "When this is clicked, open:",
  format: "link",
  pattern: LINK_HREF_PATTERN,
}))
```

**Optional field**
```ts
subtitle: Type.Optional(Type.String({ title: "Description" }))
```

**Array of items**
```ts
items: Type.Array(ItemSchema, {
  title: "Items",
  minItems: 1,
  maxItems: 6,
  default: [],
})
```

**Enum as radio/dropdown** (fixed set of string options)
```ts
size: Type.Union(
  [
    Type.Literal("small", { title: "Small" }),
    Type.Literal("medium", { title: "Medium" }),
    Type.Literal("large", { title: "Large" }),
  ],
  { title: "Size", default: "medium" },
)
```

**Hidden anchor ID** (add to any block that should support in-page linking)
```ts
id: Type.Optional(Type.String({
  title: "Anchor ID",
  description: "The ID to use for anchor links",
  format: "hidden",
}))
```

---

## Registration

After writing the schema file, register it in three places:

**1. `packages/components/src/interfaces/complex/index.ts`**
```ts
export { MyComponentSchema, type MyComponentProps } from "./MyComponent"
```

**2. `packages/components/src/schemas/components.ts`** — add to `IsomerComplexComponentsMap`:
```ts
mycomponent: MyComponentSchema,
```

If the schema differs by layout (like Infobar), add a branch in `generateComponentSchema`:
```ts
if (component === "mycomponent") {
  return layout === "homepage" ? MyComponentHomepageSchema : MyComponentSchema
}
```

**3. `packages/components/src/index.ts`** — already re-exports from `interfaces`, so no change needed if step 1 is done correctly.

---

## Variant vs. new component decision

**Variant** (same component, `variant` field): same use case, same core fields, different visual treatment. The user would describe what they want the same way regardless of which variant they pick.

**New component**: different use case, OR fields that don't overlap meaningfully, OR a user would never navigate to the existing component to find this one. When in doubt: would a user click on the existing block in the picker expecting to find this? If no, it's a new component.

**Layout prop** (not a variant, not a new component): same component, same fields, different visual treatment per page context. Add `layout: IsomerPageLayoutType` to the props type and branch in the implementation. The schema stays identical.
