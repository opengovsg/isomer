import { Meta, StoryFn } from "@storybook/react"
import { useState } from "react"
import { SortKey } from "~/common/CollectionSort"
import CollectionSortProps from "~/templates/next/types/CollectionSort"
import CollectionSort from "./CollectionSort"

export default {
  title: "Next/Internal Components/CollectionSort",
  component: CollectionSort,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<CollectionSortProps> = (args) => {
  const [sortBy, setSortBy] = useState<SortKey>(args.sortBy)
  const [sortDirection, setSortDirection] = useState(args.sortDirection)
  return (
    <CollectionSort
      sortBy={sortBy}
      setSortBy={setSortBy}
      sortDirection={sortDirection}
      setSortDirection={setSortDirection}
    />
  )
}

// Default scenario
export const Default = Template.bind({})
Default.args = {
  sortBy: "date",
  sortDirection: "desc",
}
