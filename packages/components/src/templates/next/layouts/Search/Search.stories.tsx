import type { Meta, StoryObj } from "@storybook/react-vite"

import { withChromaticModes } from "@isomer/storybook-config"

import {
  SEARCHSG_TEST_CLIENT_ID,
  withSearchSgSetup,
} from "~/stories/decorators"
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

export const SearchSG: Story = {
  name: "SearchSG",
  args: {
    layout: "search",
    site: generateSiteConfig({
      search: {
        type: "searchSG",
        clientId: SEARCHSG_TEST_CLIENT_ID,
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
