import type { Meta, StoryObj } from "@storybook/react"

import { withChromaticModes } from "@isomer/storybook-config"

import type { NotFoundPageSchemaType } from "~/engine"
import NotFoundLayout from "./NotFound"

const meta: Meta<NotFoundPageSchemaType> = {
  title: "Next/Layouts/NotFound",
  component: NotFoundLayout,
  argTypes: {},
  tags: ["!autodocs"],
  parameters: {
    layout: "fullscreen",
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<NotFoundPageSchemaType>

export const Default: Story = {
  name: "NotFound",
  args: {
    layout: "notfound",
    site: {
      siteName: "Isomer Next",
      siteMap: {
        id: "1",
        title: "Home",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
        children: [],
      },
      theme: "isomer-next",
      isGovernment: true,
      logoUrl: "/.storybook/assets/isomer-logo.svg",
      navBarItems: [],
      footerItems: {
        privacyStatementLink: "https://www.isomer.gov.sg/privacy",
        termsOfUseLink: "https://www.isomer.gov.sg/terms",
        siteNavItems: [],
      },
      lastUpdated: "1 Jan 2021",
      search: {
        type: "localSearch",
        searchUrl: "/search",
      },
    },
    meta: {
      description: "Search results",
    },
    page: {
      title: "Search",
      permalink: "/404.html",
      lastModified: "2024-05-02T14:12:57.160Z",
    },
  },
}
