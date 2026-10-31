import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ImageAdjustment } from "~/interfaces/complex/Image"
import { generateSiteConfig } from "~/stories/helpers"

import { withChromaticModes } from "@isomer/storybook-config"

import { HeroBlock } from "./HeroBlock"

// W1-B end-to-end demo: HeroBlock driven through its real `imageAdjustment`
// schema field (not a throwaway spike prop). Proves focal -> object-position
// flows schema -> props -> ImageClient. HeroBlock has a unique layout quirk:
// hard mobile height (h-80 / 320px), so mobile aspectRatio is fixed at 375×320,
// while desktop shows the image as a half-width panel (720px wide at 1440 viewport
// with 500px min-height). Focal behavior differs markedly: on the narrow mobile
// band, horizontal focal dominates; on the wide desktop panel, vertical focal
// dominates.
const meta: Meta<typeof HeroBlock> = {
  title: "Next/Components/Hero/HeroBlock/ImageAdjustment",
  component: HeroBlock,
  parameters: {
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    themes: { themeOverride: "Isomer Next" },
  },
}

export default meta
type Story = StoryObj<typeof HeroBlock>

// A full, valid imageAdjustment object. crop/rotate/flip are baked into the src
// in production, so here they are identity; only `focal` acts at render time.
const adjustmentWithFocal = (x: number, y: number): ImageAdjustment => ({
  crop: { x: 0, y: 0, width: 1, height: 1 },
  focal: { x, y },
  rotate: 0,
  flipH: false,
  flipV: false,
  originalKey: "1/00000000-0000-0000-0000-000000000000/original.jpg",
})

const SHARED = {
  type: "hero" as const,
  variant: "block" as const,
  headingLevel: 1,
  site: generateSiteConfig(),
  backgroundUrl:
    "https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?q=80&w=3870&auto=format&fit=crop",
  buttonLabel: "Explore",
  buttonUrl: "/",
}

export const NoAdjustment: Story = {
  args: {
    ...SHARED,
    title: "No adjustment (object-center default)",
    subtitle:
      "Omitting imageAdjustment is a no-op — no object-position emitted.",
  },
}

export const FocalTop: Story = {
  args: {
    ...SHARED,
    title: "Focal top (y = 0)",
    subtitle:
      "The top edge stays pinned across all breakpoints. On mobile (narrow band), horizontal focal dominates. On desktop (wide panel), the full top sliver fits — focal vertical is inert.",
    imageAdjustment: adjustmentWithFocal(0.5, 0),
  },
}

export const FocalBottom: Story = {
  args: {
    ...SHARED,
    title: "Focal bottom (y = 1)",
    subtitle:
      "The bottom edge stays pinned across all breakpoints. On mobile (narrow band), horizontal focal dominates. On desktop (wide panel), the full bottom sliver fits — focal vertical is inert.",
    imageAdjustment: adjustmentWithFocal(0.5, 1),
  },
}

export const FocalLeft: Story = {
  args: {
    ...SHARED,
    title: "Focal left (x = 0)",
    subtitle:
      "The left edge stays pinned across all breakpoints. On mobile (narrow band), horizontal focal dominates — the subject moves off-center. On desktop (wide panel), horizontal focal is inert.",
    imageAdjustment: adjustmentWithFocal(0, 0.5),
  },
}

export const FocalRight: Story = {
  args: {
    ...SHARED,
    title: "Focal right (x = 1)",
    subtitle:
      "The right edge stays pinned across all breakpoints. On mobile (narrow band), horizontal focal dominates — the subject moves off-center. On desktop (wide panel), horizontal focal is inert.",
    imageAdjustment: adjustmentWithFocal(1, 0.5),
  },
}
