import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Box } from "@chakra-ui/react"
import {
  HERO_BANNER_STYLE_FORMAT,
  HERO_STYLE,
} from "@opengovsg/isomer-components"
import { Type } from "@sinclair/typebox"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { FormBuilder } from "./formBuilder"

type HeroStyleId = keyof typeof HERO_STYLE

const HERO_BANNER_VARIANT_SCHEMA_OPTIONS = {
  gradient: {},
  block: {},
  largeImage: {},
  floating: {},
  carousel: {},
  searchbar: { format: "hidden" },
} satisfies Record<HeroStyleId, { format?: string }>

const heroBannerStyleOneOf = (Object.keys(HERO_STYLE) as HeroStyleId[]).map(
  (id) => {
    const { key, title } = HERO_STYLE[id]
    return Type.Object(
      { variant: Type.Literal(key) },
      { title, ...HERO_BANNER_VARIANT_SCHEMA_OPTIONS[id] },
    )
  },
)

const schema = Type.Unsafe({
  title: "Hero banner style",
  format: HERO_BANNER_STYLE_FORMAT,
  oneOf: heroBannerStyleOneOf,
})

function HeroBannerStyleFrame({ data }: { data: unknown }) {
  return (
    <Box position="relative" w="26rem" h="40rem" bg="grey.50">
      <Box px="1.5rem" py="1rem">
        <FormBuilder schema={schema} data={data} />
      </Box>
    </Box>
  )
}

const meta: Meta<typeof HeroBannerStyleFrame> = {
  title: "Pages/Edit Page/components/HeroBannerStyleControl",
  component: HeroBannerStyleFrame,
}

export default meta
type Story = StoryObj<typeof HeroBannerStyleFrame>

export const Empty: Story = {
  args: {
    data: {},
  },
}

export const ChoosingStyle: Story = {
  args: {
    data: { variant: "gradient" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // The preview decorator renders a skeleton until the router is ready, so
    // the trigger is not in the canvas on the first paint.
    const caption = await canvas.findByText(
      /click to explore different styles/i,
    )
    await userEvent.click(caption.closest("button") ?? caption)

    await expect(
      await canvas.findByRole("dialog", {
        name: "Choose a hero banner style",
      }),
    ).toBeVisible()
    const block = await canvas.findByRole("radio", { name: "Block" })
    const carousel = await canvas.findByRole("radio", { name: "Carousel" })
    await expect(block).toBeVisible()
    await expect(carousel).toBeVisible()
    await expect(block.closest("label")).toHaveTextContent("New")
    await expect(carousel.closest("label")).toHaveTextContent("New")
    await expect(
      (await canvas.findByRole("radio", { name: /gradient/i })).closest(
        "label",
      ),
    ).toHaveTextContent("New")
    await expect(canvas.queryByRole("radio", { name: "Search bar" })).toBeNull()
  },
}

export const ConfirmLeavingCarousel: Story = {
  args: {
    data: { variant: "carousel", slides: [{}, {}, {}] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Chakra modals render in a portal outside the canvas.
    const body = within(canvasElement.ownerDocument.body)

    const caption = await canvas.findByText(
      /click to explore different styles/i,
    )
    await userEvent.click(caption.closest("button") ?? caption)

    // Choosing a style updates the preview. Save is what asks.
    await userEvent.click(await canvas.findByRole("radio", { name: "Block" }))
    await expect(
      body.queryByRole("dialog", { name: "Discard extra carousel slides?" }),
    ).toBeNull()
    await expect(canvas.getByRole("radio", { name: "Block" })).toBeChecked()

    // Save is what asks, and cancelling returns to the carousel they opened on.
    await userEvent.click(canvas.getByRole("button", { name: "Save" }))
    await userEvent.click(
      await body.findByRole("button", { name: "Keep carousel" }),
    )
    await waitFor(() =>
      expect(
        body.queryByRole("dialog", { name: "Discard extra carousel slides?" }),
      ).toBeNull(),
    )
    await expect(canvas.getByRole("radio", { name: "Carousel" })).toBeChecked()

    await userEvent.click(canvas.getByRole("radio", { name: "Block" }))
    await userEvent.click(canvas.getByRole("button", { name: "Save" }))
    const modal = await body.findByRole("dialog", {
      name: "Discard extra carousel slides?",
    })
    await expect(modal).toHaveTextContent("The other 2 slides will be removed.")
    // The modal hides the drawer from assistive tech while it is open.
    await expect(
      canvas.getByRole("radio", { name: "Block", hidden: true }),
    ).toBeChecked()

    await userEvent.click(
      within(modal).getByRole("button", { name: "Yes, change style" }),
    )
    await waitFor(() =>
      expect(
        canvas.queryByRole("dialog", { name: "Choose a hero banner style" }),
      ).toBeNull(),
    )
    await expect(canvas.getByText("Block")).toBeVisible()
  },
}
