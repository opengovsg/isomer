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
  title: "Next/Internal Components/PaginationControls",
  component: PaginationControls,
  argTypes: {},
  render: Template,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof PaginationControls>

export const SinglePage: Story = {
  args: {
    totalItems: 5,
    itemsPerPage: 6,
  },
}

export const SomePages: Story = {
  args: {
    totalItems: 26,
    itemsPerPage: 6,
  },
}

export const ManyPages: Story = {
  parameters: {
    chromatic: withChromaticModes(["mobile", "tablet"]),
  },
  args: {
    totalItems: 1240,
    itemsPerPage: 6,
  },
}
