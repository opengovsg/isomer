import type { Meta, StoryObj } from "@storybook/react"

import { withChromaticModes } from "@isomer/storybook-config"

import { withSearchSgSetup } from "~/stories/decorators"
import { generateSiteConfig } from "~/stories/helpers"
import SearchLayout from "./Search"

const meta: Meta<typeof SearchLayout> = {
  title: "Next/Layouts/Search",
  component: SearchLayout,
  decorators: [withSearchSgSetup({ pageType: "search" })],
  argTypes: {},
  tags: ["!autodocs"],
  parameters: {
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}

export default meta
type Story = StoryObj<typeof SearchLayout>

const TEST_CLIENT_ID = "5485bb61-2d5d-440a-bc37-91c48fc0c9d4"

export const SearchSG: Story = {
  name: "SearchSG",
  args: {
    layout: "search",
    site: generateSiteConfig({
      search: {
        type: "searchSG",
        clientId: TEST_CLIENT_ID,
      },
    }),
    meta: {
      description: "Search results",
    },
    page: {
      title: "Search",
      permalink: "/search",
      lastModified: "2024-05-02T14:12:57.160Z",
    },
  },
}
