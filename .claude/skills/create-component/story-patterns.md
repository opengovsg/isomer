# Story Patterns

Reference for writing Storybook stories for a new component.

Each component needs two sets of stories:
1. **Component stories** — in the component folder, covering every meaningful state
2. **Layout story entry** — the component added to its relevant layout's existing story

---

## Imports and meta

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite"
import { generateSiteConfig } from "~/stories/helpers"
import { withChromaticModes } from "@isomer/storybook-config"

import { MyComponent } from "./MyComponent"

const meta: Meta<typeof MyComponent> = {
  title: "Next/Components/MyComponent",
  component: MyComponent,
  parameters: {
    layout: "fullscreen",
    chromatic: withChromaticModes(["desktop", "mobile"]),
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  args: {
    site: generateSiteConfig(),
  },
}
export default meta
type Story = StoryObj<typeof MyComponent>
```

**`layout: "fullscreen"`** — always set this. Components are full-width and need the canvas to match.

**`chromatic: withChromaticModes(["desktop", "mobile"])`** — the standard set for most components. Use `["mobile", "tablet", "desktop"]` for components where the tablet breakpoint has a distinct layout (e.g. 2-column grids that shift at `md`). Use `["mobileSmall", "mobile", "tablet", "desktop"]` only for Hero and other full-bleed components where small mobile is meaningfully different.

**`args.site: generateSiteConfig()`** — always set this in meta args so every story inherits it.

---

## What stories to write

Write one story per meaningful state. Cover all of:

| Dimension | Stories to write |
|-----------|-----------------|
| **Variants** | One story per schema variant (`cardsWithImages`, `cardsWithoutImages`, etc.) |
| **Layout context** | One story per layout the component appears in (homepage, content page) if the visual treatment differs |
| **Text length** | A `LongContent` story with near-maximum text in every string field. A `ShortContent` or minimal story where appropriate. |
| **Optional fields** | A story with all optional fields populated, and a story with only required fields. |
| **Interactive state** | A story with `play()` showing the component after user interaction (expanded accordion, hovered card, etc.) — only for components with interactive states. |

Naming convention: `Default`, `LongContent`, `ShortContent`, `WithoutSubtitle`, `Expanded`, `WithImage`, `WithoutImage`, `HomepageLayout`. Use plain descriptive names — no numbers.

---

## Basic story

```tsx
export const Default: Story = {
  args: {
    title: "Section title",
    subtitle: "An optional description for the section",
    items: [
      { title: "First item", description: "Description" },
      { title: "Second item", description: "Description" },
    ],
  },
}
```

---

## Long content story

Always include one. Stress-test every string field close to its `maxLength`. This catches layout breaks from long text.

```tsx
export const LongContent: Story = {
  args: {
    title:
      "A very long section title that will push the layout to its limits and may cause wrapping on smaller screens",
    subtitle:
      "This is a much longer description than you would normally see in production. It tests how the component handles multi-line subtitle text across different screen sizes and ensures the layout remains stable.",
    items: [
      {
        title:
          "An item title that is long enough to wrap across multiple lines on mobile viewports",
        description:
          "A description that is deliberately verbose to test how the card handles multi-line body text without breaking its visual rhythm or overflowing its container.",
      },
    ],
  },
}
```

---

## Rendering multiple instances

For inline components (Accordion, Callout, Blockquote) that users stack, use a `render` function in meta to show 2–3 stacked instances. This tests the inter-component spacing (`mt-7`) and border/divider behaviour:

```tsx
const meta: Meta<typeof Accordion> = {
  // ...
  render: ({ summary, ...args }) => (
    <>
      <Accordion summary={`${summary} 1`} {...args} />
      <Accordion summary={`${summary} 2`} {...args} />
      <Accordion summary={`${summary} 3`} {...args} />
    </>
  ),
}
```

---

## Interactive state with `play()`

For components with user interactions (expand/collapse, hover, focus), add a story that uses `play()` to put the component in an interacted state:

```tsx
import { userEvent, within } from "storybook/test"

export const Expanded: Story = {
  args: Default.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText("Title for accordion item 2"))
  },
}
```

This story renders in Chromatic with the interaction applied — the visual regression test captures the expanded state.

---

## Component with layout variants

For layout-aware components (InfoCols, ContactInformation), write one story per layout context:

```tsx
export const ContentPage: Story = {
  args: {
    layout: "content",
    title: "Section title",
    // ...
  },
}

export const Homepage: Story = {
  args: {
    layout: "homepage",
    title: "Section title",
    // ...
  },
}
```

---

## Multi-variant component

For components with a `variant` discriminator (InfoCards, Hero), write one story per variant. Name each story after the variant:

```tsx
export const WithImages: Story = {
  args: {
    variant: "cardsWithImages",
    title: "Cards",
    cards: [...],
  },
}

export const WithoutImages: Story = {
  args: {
    variant: "cardsWithoutImages",
    title: "Cards",
    cards: [...],
  },
}
```

---

## Adding the component to a layout story

After writing the component stories, add a block entry to the relevant layout story's `content` array. This ensures the component is visually regression-tested in context.

**Location of layout stories:**
- Homepage components → `packages/components/src/templates/next/layouts/Homepage/Homepage.stories.tsx`
- Content-page components → `packages/components/src/templates/next/layouts/Content/Content.stories.tsx`
- Components that appear in both → add to both

**How to add it:**

Find the `Default` story's `content` array and append a realistic block entry. Use the same args as the component's `Default` story.

```tsx
// In Content.stories.tsx, inside the Default story's content array:
{
  type: "mycomponent",
  title: "Section title",
  subtitle: "An optional description",
  items: [
    { title: "First item", description: "Description" },
    { title: "Second item", description: "Description" },
  ],
},
```

Place it near other components of the same visual weight — inline components (Accordion, Callout) go in the body section, section-level components (InfoCards, InfoCols) go after the main body content.
