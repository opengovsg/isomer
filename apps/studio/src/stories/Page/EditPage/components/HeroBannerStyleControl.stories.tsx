import type { Meta, StoryObj } from "@storybook/nextjs"
import { Box } from "@chakra-ui/react"
import {
  HERO_BANNER_STYLE_FORMAT,
  HERO_STYLE,
} from "@opengovsg/isomer-components"
import { Type } from "@sinclair/typebox"
import { expect, userEvent, within } from "storybook/test"

import { FormBuilder } from "./formBuilder"

const schema = Type.Unsafe({
  title: "Hero banner style",
  format: HERO_BANNER_STYLE_FORMAT,
  oneOf: [
    Type.Object(
      { variant: Type.Literal(HERO_STYLE.gradient.key) },
      { title: HERO_STYLE.gradient.title },
    ),
    Type.Object(
      { variant: Type.Literal(HERO_STYLE.block.key) },
      { title: HERO_STYLE.block.title },
    ),
    Type.Object(
      { variant: Type.Literal(HERO_STYLE.largeImage.key) },
      { title: HERO_STYLE.largeImage.title },
    ),
    Type.Object(
      { variant: Type.Literal(HERO_STYLE.floating.key) },
      { title: HERO_STYLE.floating.title },
    ),
    Type.Object(
      { variant: Type.Literal(HERO_STYLE.searchbar.key) },
      { title: HERO_STYLE.searchbar.title, format: "hidden" },
    ),
  ],
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

export const GradientSelected: Story = {
  args: {
    data: { variant: "gradient" },
  },
}

export const BlockSelected: Story = {
  args: {
    data: { variant: "block" },
  },
}

export const ChoosingStyle: Story = {
  args: {
    data: { variant: "gradient" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(
      canvas.getByText(/click to explore different styles/i),
    )

    await expect(
      canvas.getByRole("dialog", { name: "Choose a hero banner style" }),
    ).toBeVisible()
    await expect(canvas.getByRole("radio", { name: "Block" })).toBeVisible()
    await expect(canvas.queryByRole("radio", { name: "Search bar" })).toBeNull()
  },
}
