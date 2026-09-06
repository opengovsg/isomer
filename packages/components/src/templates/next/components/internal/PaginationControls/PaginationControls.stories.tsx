import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"

import { withChromaticModes } from "@isomer/storybook-config"

import type { PaginationProps } from "../../../types/Pagination"
import { PaginationControls } from "./PaginationControls"

// Template for stories
const Template = (props: Omit<PaginationProps, "currPage" | "setCurrPage">) => {
  const [currPage, setCurrPage] = useState<number>(1)
  return (
    <PaginationControls
      {...props}
      currPage={currPage}
      setCurrPage={setCurrPage}
    />
  )
}

const meta: Meta<PaginationProps> = {
  argTypes: {},
  component: PaginationControls,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  render: Template,
  title: "Next/Internal Components/PaginationControls",
}
export default meta
type Story = StoryObj<typeof PaginationControls>

export const SinglePage: Story = {
  args: {
    itemsPerPage: 6,
    totalItems: 5,
  },
}

export const SomePages: Story = {
  args: {
    itemsPerPage: 6,
    totalItems: 26,
  },
}

export const ManyPages: Story = {
  args: {
    itemsPerPage: 6,
    totalItems: 1240,
  },
  parameters: {
    chromatic: withChromaticModes(["mobile", "tablet"]),
  },
}
