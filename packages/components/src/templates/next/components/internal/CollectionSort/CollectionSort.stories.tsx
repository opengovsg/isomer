import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"

import type { SortKey } from "~/interfaces/internal/CollectionSort"
import type CollectionSortProps from "~/templates/next/types/CollectionSort"
import CollectionSort from "./CollectionSort"

// Template for stories
const Template = (props: CollectionSortProps) => {
  const [sortBy, setSortBy] = useState<SortKey>(props.sortBy)
  const [sortDirection, setSortDirection] = useState(props.sortDirection)
  return (
    <CollectionSort
      sortBy={sortBy}
      setSortBy={setSortBy}
      sortDirection={sortDirection}
      setSortDirection={setSortDirection}
    />
  )
}

const meta: Meta<typeof Template> = {
  title: "Next/Internal Components/CollectionSort",
  component: Template,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof Template>

// Default scenario
export const Default: Story = {
  args: {
    sortBy: "date",
    sortDirection: "desc",
  },
}
