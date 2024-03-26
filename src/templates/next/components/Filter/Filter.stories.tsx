import type { StoryFn, Meta } from "@storybook/react"
import Filter from "./Filter"
import type { FilterProps } from "~/common"
import { useState } from "react"
import { AppliedFilter } from "~/common/Filter"

export default {
  title: "Next/Components/Filter",
  component: Filter,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<
  Omit<FilterProps, "appliedFilters" | "setAppliedFilters">
> = (args) => {
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>([])
  return (
    <Filter
      appliedFilters={appliedFilters}
      setAppliedFilters={setAppliedFilters}
      {...args}
    />
  )
}

// Default scenario
export const Default = Template.bind({})
Default.args = {
  filters: [
    {
      id: "type",
      label: "Type",
      items: [
        { id: "article", label: "Article" },
        { id: "speech", label: "Speech" },
        { id: "press-release", label: "Press Release" },
        { id: "blog", label: "Blog" },
      ],
    },
    {
      id: "category",
      label: "Category",
      items: [
        { id: "checkbox-default", label: "Checkbox Default" },
        { id: "checkbox-default", label: "Checkbox Default" },
        { id: "checkbox-default", label: "Checkbox Default" },
        { id: "checkbox-default", label: "Checkbox Default" },
      ],
    },
    {
      id: "year",
      label: "Year",
      items: [
        { id: "2024", label: "2024" },
        { id: "2023", label: "2023" },
        { id: "2022", label: "2022" },
        { id: "2021", label: "2021" },
        { id: "2020", label: "2020" },
      ],
    },
  ],
}
