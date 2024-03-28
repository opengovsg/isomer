import type { StoryFn, Meta } from "@storybook/react"
import CollectionSearch from "./CollectionSearch"
import type { CollectionSearchProps } from "../../../types/CollectionSearch"
import { useState } from "react"

export default {
  title: "Next/Components/CollectionSearch",
  component: CollectionSearch,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<Omit<CollectionSearchProps, "search" | "setSearch">> = (
  args,
) => {
  const [search, setSearch] = useState<string>("")
  return <CollectionSearch search={search} setSearch={setSearch} {...args} />
}

// Default scenario
export const Default = Template.bind({})
Default.args = {
  placeholder: "Search for a publication",
}
