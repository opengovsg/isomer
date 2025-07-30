import type { Meta, StoryObj } from "@storybook/react"
import { useEffect } from "react"

import { withChromaticModes } from "@isomer/storybook-config"

import type { SearchPageSchemaType } from "~/engine"
import SearchLayout from "./Search"
import { generateSiteConfig } from ".storybook/helpers"

// Template for stories
const Template = (props: SearchPageSchemaType) => {
  // Note: This is needed because the script tag is not rendered in the storybook
  useEffect(() => {
    if (props.site.search && props.site.search.type !== "searchSG") return

    const scriptTag = document.createElement("script")
    scriptTag.src = `https://api.search.gov.sg/v1/searchconfig.js?clientId=${TEST_CLIENT_ID}&page=result`
    scriptTag.setAttribute("defer", "")
    document.body.appendChild(scriptTag)

    return () => {
      document.body.removeChild(scriptTag)
    }
  }, [props.site.search])

  return <SearchLayout {...props} />
}

const meta: Meta<typeof Template> = {
  title: "Next/Layouts/Search",
  component: Template,
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
type Story = StoryObj<typeof Template>

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
