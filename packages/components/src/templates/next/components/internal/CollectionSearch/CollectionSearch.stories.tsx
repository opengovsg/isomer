import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"

import type { CollectionSearchProps } from "../../../types/CollectionSearch"
import CollectionSearch from "./CollectionSearch"

// Template for stories
const Template = (
  props: Omit<CollectionSearchProps, "search" | "setSearch">,
) => {
  const [search, setSearch] = useState<string>("")
  return <CollectionSearch search={search} setSearch={setSearch} {...props} />
}

const meta: Meta<typeof Template> = {
  title: "Next/Internal Components/CollectionSearch",
  component: Template,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof CollectionSearch>

// Default scenario
export const Default: Story = {
  args: {
    placeholder: "Search for a publication",
  },
}
