import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ImageAdjustment } from "~/interfaces/complex/Image"
import {
  HERO_BLOCK_IMAGE_POSITION,
  HERO_CAROUSEL_CONTENT_ALIGNMENT,
  HERO_CAROUSEL_LAYOUT,
} from "~/interfaces/complex/Hero"
import { generateSiteConfig } from "~/stories/helpers"

import { withArgosModes } from "@isomer/storybook-config"

import { HeroCarousel } from "./HeroCarousel"

// End-to-end demo: each carousel slide's per-slide `backgroundUrlImageAdjustment`
// schema field flows through HeroCarousel -> slideViews -> the shared
// CarouselSlideImages -> ImageClientWithAdjustment -> object-position. Proven for
// BOTH layouts (block + gradient), since both render slide images through the
// same CarouselSlideImages component. Each slide carries a distinct focal point,
// so flipping between slides shows the focal actually biting on the hero band.
const meta: Meta<typeof HeroCarousel> = {
  title: "Next/Components/Hero/HeroCarousel/ImageAdjustment",
  component: HeroCarousel,
  parameters: {
    argos: withArgosModes(["mobile", "tablet", "desktop"]),
    themes: { themeOverride: "Isomer Next" },
  },
}

export default meta
type Story = StoryObj<typeof HeroCarousel>

// A full, valid imageAdjustment object. crop is baked into the src in
// production, so here it is identity; only `focal` acts at render time.
const adjustmentWithFocal = (x: number, y: number): ImageAdjustment => ({
  crop: { x: 0, y: 0, width: 1, height: 1 },
  focal: { x, y },
  originalKey: "1/00000000-0000-0000-0000-000000000000/original.jpg",
})

// Two slides (meets HERO_CAROUSEL_SLIDE_LIMITS.minItems), each with a distinct
// focal point so the first slide pins the top-left and the second the
// bottom-right — proving the per-slide adjustment is honoured independently.
const slidesWithFocal = [
  {
    backgroundUrl:
      "https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?q=80&w=3870&auto=format&fit=crop",
    backgroundUrlImageAdjustment: adjustmentWithFocal(0, 0),
    title: "Focal top-left (slide 1)",
    subtitle: "This slide pins the top-left corner of the image.",
    buttonLabel: "Get started",
    buttonUrl: "/",
  },
  {
    backgroundUrl:
      "https://images.unsplash.com/photo-1594318142972-1e2ea7487a3e?q=80&w=1740&auto=format&fit=crop",
    backgroundUrlImageAdjustment: adjustmentWithFocal(1, 1),
    title: "Focal bottom-right (slide 2)",
    subtitle: "This slide pins the bottom-right corner of the image.",
    buttonLabel: "Learn more",
    buttonUrl: "/",
  },
]

const SHARED = {
  headingLevel: 1,
  site: generateSiteConfig(),
  type: "hero" as const,
  variant: "carousel" as const,
  slides: slidesWithFocal,
}

export const BlockLayout: Story = {
  args: {
    ...SHARED,
    carousel: {
      layout: HERO_CAROUSEL_LAYOUT.block,
      imagePosition: HERO_BLOCK_IMAGE_POSITION.right,
    },
  },
}

export const GradientLayout: Story = {
  args: {
    ...SHARED,
    carousel: {
      layout: HERO_CAROUSEL_LAYOUT.gradient,
      contentAlignment: HERO_CAROUSEL_CONTENT_ALIGNMENT.left,
    },
  },
}
