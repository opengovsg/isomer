---
name: create-component
description: Creates a new UI component in the Isomer Next monorepo — schema, implementation, stories, Studio block registration, and Studio story.
---

# Create Isomer Component Skill

You are creating a new component in the Isomer Next monorepo. Follow these steps in order, completing each fully before moving on.

## Inputs to gather before starting

Ask the user for (or infer from context):
- **Component name** — PascalCase (e.g. `CalloutBox`)
- **Component type** — `complex` (has its own schema/block in Studio) or `native` (used inside prose/content)
- **Allowed layouts** — which page layouts can include this block (e.g. `homepage`, `content`, `article`). Refer to `apps/studio/src/components/PageEditor/constants.ts` for the existing layout arrays (`CONTENT_ALLOWED_BLOCKS`, `ARTICLE_ALLOWED_BLOCKS`, etc.)
- **Props** — field names, types, optionality, descriptions, labels, character limits, formats
- **Any new design tokens needed?**

---

## Step 1 — Define the TypeBox schema

Create the interface file at:
```
packages/components/src/interfaces/{complex|native}/{ComponentName}/{ComponentName}.ts
```

Rules:
- Use `Type.Object(fields, options)` with `$id`, `title`, `description` at the top level
- The `type` field must be `Type.Literal("componentname", { default: "componentname" })`
- Every string field needs at least `title`. Add `description` for non-obvious fields
- Use `maxLength` for any free-text field that has a character cap
- Use `format: "textarea"` for multi-line strings, `format: "link"` for URLs, `format: "hidden"` for internal fields not shown in Studio UI
- Use `format: "image"` for image upload fields
- Optional fields use `Type.Optional(...)`
- Arrays use `Type.Array(..., { title, minItems?, maxItems? })`
- Group related fields using the `groups` option: `groups: [{ label: "...", fields: [...] }]`
- Export both the schema and the `type XProps = Static<typeof XSchema> & { site: IsomerSiteProps; layout?: IsomerPageLayoutType }`

Create the barrel export at:
```
packages/components/src/interfaces/{complex|native}/{ComponentName}/index.ts
```

Add the export to:
```
packages/components/src/interfaces/{complex|native}/index.ts
```

---

## Step 2 — Register the schema

Open `packages/components/src/schemas/components.ts` and add the component to the appropriate map:
- `IsomerComplexComponentsMap` for complex components
- `IsomerNativeComponentsMap` for native components

If the component has layout-specific schema variants (like `infobar` which has homepage vs default variants), handle the layout-switching logic in `getComponentSchema`.

---

## Step 3 — Implement the component

Create the component at:
```
packages/components/src/templates/next/components/{complex|native}/{ComponentName}/{ComponentName}.tsx
```

Rules:
- Accept props typed as `XProps`
- Use Tailwind CSS classes for styling; follow patterns from nearby components
- If the component has variants, create separate `{ComponentName}{Variant}.tsx` files and a main switcher
- Export from an `index.ts` in the folder

Add the component export to the relevant barrel:
```
packages/components/src/templates/next/components/{complex|native}/index.ts
```

And the top-level package export in `packages/components/src/index.ts` if it's a new top-level export.

---

## Step 4 — Write component Storybook stories

Create:
```
packages/components/src/templates/next/components/{complex|native}/{ComponentName}/{ComponentName}.stories.tsx
```

Rules:
- Use `Meta<typeof ComponentName>` and `StoryObj<typeof ComponentName>`
- Set `title: "Next/Components/{ComponentName}"`
- Add `parameters.chromatic: withChromaticModes(["mobile", "tablet", "desktop"])`
- Add `parameters.themes: { themeOverride: "Isomer Next" }`
- Write a story per variant and at least one story per meaningful content length variation (short text, long text, minimal fields, all fields populated)
- Use `generateSiteConfig()` from test helpers for the `site` prop

---

## Step 5 — Write logic utilities and tests (if applicable)

If the component involves non-trivial logic (data transformation, filtering, calculations):
- Create utility functions in the component folder or in `packages/components/src/utils/`
- Co-locate tests as `{utilName}.test.ts`
- Run `pnpm test:unit` from `apps/studio` to confirm passing

---

## Step 6 — Define new tokens (if applicable)

If new design tokens are needed, add them to `packages/components/src/types/theme.ts` following the naming convention:
- `colors.brand.{role}.{variant}` — e.g. `colors.brand.canvas.default`
- Use `format: "hidden"` for tokens not configurable via Studio UI
- Use `format: "color-picker"` for user-configurable colour tokens with a `title` and `description`
- Add new tokens to `SiteThemeSchema` inside `Type.Object`

---

## Step 7 — Add the component to relevant layout stories

For each layout this block belongs to, add it to the layout's stories file at:
```
packages/components/src/templates/next/layouts/{LayoutName}/{LayoutName}.stories.tsx
```

Add the block to the `content` array in the relevant stories so the component is visible in the layout preview. Match the existing pattern (object with `type: "componentname"` and all required props).

---

## Step 8 — Register the block in Studio

### 8a. Add allowed layouts

Open `apps/studio/src/components/PageEditor/constants.ts`.

Add the component type string to each relevant allowed-blocks array:
- `CONTENT_ALLOWED_BLOCKS` — for content pages
- `ARTICLE_ALLOWED_BLOCKS` — for article pages
- `DATABASE_ALLOWED_BLOCKS` — for database pages
- Use `getHomepageAllowedBlocks(...)` return value for homepage (may need to modify that function)
- `INDEX_ALLOWED_BLOCKS` — for index pages

### 8b. Add block metadata

In the same `constants.ts` file, add an entry to `BLOCK_TO_META`:
```typescript
componentname: {
  label: "Short human label",                    // shown in the block picker
  description: "One sentence describing what this block does and when to use it.",
},
```
Optionally add `usageText` (extended tooltip text) and `imageSrc` (preview image path).

### 8c. Add block icon

Open `apps/studio/src/features/editing-experience/constants.ts` and add the icon mapping to `TYPE_TO_ICON`:
```typescript
componentname: <SomeIcon />,
```
Choose a Chakra UI or Phosphor icon that best represents the block's purpose.

---

## Step 9 — Write the Studio Storybook story

Create or extend a story file under:
```
apps/studio/src/stories/Page/EditPage/Edit{LayoutName}Page.stories.tsx
```

Rules:
- Use `@storybook/nextjs`
- Set up MSW handlers for any tRPC calls the editor makes
- Write a `play` function that opens the component editor:
  ```typescript
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", { name: /component label/i })
    await userEvent.click(button)
  }
  ```
- Name it `Edit{ComponentName}` 
- Include `parameters.msw.handlers`, `parameters.nextjs.router`, and `parameters.getLayout` following existing stories

---

## Checklist

Before calling the task done, verify:
- [ ] Schema exports correctly from `packages/components/src/interfaces/index.ts`
- [ ] Schema registered in `packages/components/src/schemas/components.ts`
- [ ] Component renders without errors in Storybook (`pnpm storybook`)
- [ ] All required story variants written
- [ ] Block appears in the correct layout's "Add block" panel in Studio
- [ ] Block metadata (label, description) is set in `BLOCK_TO_META`
- [ ] Studio Storybook story opens the editing drawer for the block
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
