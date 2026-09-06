import type { Meta, StoryObj } from "@storybook/react-vite"
import type { NotFoundPageSchemaType } from "~/types"
import { generateSiteConfig } from "~/stories/helpers"

import { withChromaticModes } from "@isomer/storybook-config"

import { NotFoundLayout } from "./NotFound"

const meta: Meta<typeof NotFoundLayout> = {
  argTypes: {},
  component: NotFoundLayout,
  parameters: {
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    layout: "fullscreen",
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  tags: ["!autodocs"],
  title: "Next/Layouts/NotFound",
}
export default meta
type Story = StoryObj<NotFoundPageSchemaType>

export const Default: Story = {
  args: {
    layout: "notfound",
    meta: {
      description: "Search results",
    },
    page: {
      lastModified: "2024-05-02T14:12:57.160Z",
      permalink: "/404.html",
      title: "Search",
    },
    site: generateSiteConfig(),
  },
  name: "NotFound",
}
