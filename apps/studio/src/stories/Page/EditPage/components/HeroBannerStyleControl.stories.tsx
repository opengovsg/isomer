import type { Meta, StoryObj } from "@storybook/nextjs"
import { Box } from "@chakra-ui/react"
import {
  HERO_BANNER_STYLE_FORMAT,
  HERO_STYLE,
} from "@opengovsg/isomer-components"
import { Type } from "@sinclair/typebox"
import { expect, userEvent, within } from "storybook/test"

import { FormBuilder } from "./formBuilder"

type HeroStyleId = keyof typeof HERO_STYLE

const HERO_BANNER_VARIANT_SCHEMA_OPTIONS = {
  gradient: {},
  block: {},
  largeImage: {},
  floating: {},
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
    await expect(
      await canvas.findByRole("radio", { name: "Block" }),
    ).toBeVisible()
    await expect(canvas.queryByRole("radio", { name: "Search bar" })).toBeNull()
  },
}
