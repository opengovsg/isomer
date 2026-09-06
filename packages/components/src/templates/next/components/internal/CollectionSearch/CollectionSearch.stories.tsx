import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"

import type { CollectionSearchProps } from "../../../types/CollectionSearch"
import { CollectionSearch } from "./CollectionSearch"

// Template for stories
const Template = (
  props: Omit<CollectionSearchProps, "search" | "setSearch">,
) => {
  const [search, setSearch] = useState<string>("")
  return <CollectionSearch search={search} setSearch={setSearch} {...props} />
}

const meta: Meta<typeof Template> = {
  argTypes: {},
  component: Template,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Internal Components/CollectionSearch",
}
export default meta
type Story = StoryObj<typeof CollectionSearch>

// Default scenario
export const Default: Story = {
  args: {
    placeholder: "Search for a publication",
  },
}
