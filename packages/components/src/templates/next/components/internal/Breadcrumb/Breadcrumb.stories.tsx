import type { Meta, StoryObj } from "@storybook/react"

import type { BreadcrumbProps } from "~/interfaces"
import Breadcrumb from "./Breadcrumb"

const meta: Meta<BreadcrumbProps> = {
  title: "Next/Internal Components/Breadcrumb",
  component: Breadcrumb,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof Breadcrumb>

export const Grandchild: Story = {
  args: {
    links: [
      {
        title: "Irrationality",
        url: "/irrationality",
      },
      {
        title: "For Individuals",
        url: "/irrationality/individuals",
      },
      {
        title: "Steven Pinker's Rationality",
        url: "/irrationality/individuals/pinker-rationality",
      },
    ],
  },
}

export const SingleChild: Story = {
  args: {
    links: [
      {
        title: "Irrationality",
        url: "/irrationality",
      },
      {
        title: "For Individuals",
        url: "/irrationality/individuals",
      },
    ],
  },
}

export const NoChildren: Story = {
  args: {
    links: [
      {
        title: "Irrationality",
        url: "/irrationality",
      },
    ],
  },
}
