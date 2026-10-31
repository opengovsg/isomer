import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ImageAdjustment } from "~/interfaces/complex/Image"
import { generateSiteConfig } from "~/stories/helpers"

import { withChromaticModes } from "@isomer/storybook-config"

import { Infopic } from "./Infopic"

// W1-C end-to-end demo: Infopic driven through its real `imageAdjustment`
// schema field (not a throwaway spike prop). Proves focal -> object-position
// (Block) and backgroundPosition (Full) flow schema -> props -> render.
// Infopic's frame is content-dependent (text height varies), so the preview
// aspect ratios are approximations; focal behavior is uniform across both
// variants within each breakpoint.
const meta: Meta<typeof Infopic> = {
  title: "Next/Components/Infopic/ImageAdjustment",
  component: Infopic,
  parameters: {
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    themes: { themeOverride: "Isomer Next" },
  },
}

export default meta
type Story = StoryObj<typeof Infopic>

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
  type: "infopic" as const,
  title: "Isomer Infopic",
  description:
    "This component demonstrates image adjustment with focal point control.",
  headingLevel: 2,
  site: generateSiteConfig(),
  imageSrc:
    "https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?q=80&w=3870&auto=format&fit=crop",
  imageAlt: "Sample infopic image",
}

export const BlockNoAdjustment: Story = {
  args: {
    ...SHARED,
    variant: "block",
    title: "Block – No adjustment (object-center default)",
  },
}

export const BlockFocalTop: Story = {
  args: {
    ...SHARED,
    variant: "block",
    title: "Block – Focal top (y = 0)",
    imageAdjustment: adjustmentWithFocal(0.5, 0),
  },
}

export const BlockFocalBottom: Story = {
  args: {
    ...SHARED,
    variant: "block",
    title: "Block – Focal bottom (y = 1)",
    imageAdjustment: adjustmentWithFocal(0.5, 1),
  },
}

export const FullNoAdjustment: Story = {
  args: {
    ...SHARED,
    variant: "full",
    title: "Full – No adjustment (background-center default)",
  },
}

export const FullFocalTop: Story = {
  args: {
    ...SHARED,
    variant: "full",
    title: "Full – Focal top (y = 0)",
    imageAdjustment: adjustmentWithFocal(0.5, 0),
  },
}

export const FullFocalBottom: Story = {
  args: {
    ...SHARED,
    variant: "full",
    title: "Full – Focal bottom (y = 1)",
    imageAdjustment: adjustmentWithFocal(0.5, 1),
  },
}
