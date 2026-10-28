import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ImageAdjustment } from "~/interfaces/complex/Image"
import { generateSiteConfig } from "~/stories/helpers"

import { withChromaticModes } from "@isomer/storybook-config"

import { HeroGradient } from "./HeroGradient"

// W0-G end-to-end demo: HeroGradient driven through its real `imageAdjustment`
// schema field (not the throwaway spike prop). Proves focal -> object-position
// flows schema -> props -> ImageClient. Compare Top vs Bottom across the
// Mobile/Tablet/Desktop chromatic modes: the chosen edge stays pinned as the
// band reshapes. (Horizontal focal is near-inert on this wide band — the
// W0-S-F geometry finding.)
const meta: Meta<typeof HeroGradient> = {
  title: "Next/Components/Hero/ImageAdjustment",
  component: HeroGradient,
  parameters: {
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    themes: { themeOverride: "Isomer Next" },
  },
}

export default meta
type Story = StoryObj<typeof HeroGradient>

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
  variant: "gradient" as const,
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
    subtitle: "The top edge stays pinned across all breakpoints.",
    imageAdjustment: adjustmentWithFocal(0.5, 0),
  },
}

export const FocalBottom: Story = {
  args: {
    ...SHARED,
    title: "Focal bottom (y = 1)",
    subtitle: "The bottom edge stays pinned across all breakpoints.",
    imageAdjustment: adjustmentWithFocal(0.5, 1),
  },
}
