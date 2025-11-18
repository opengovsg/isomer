import type { Meta, StoryObj } from "@storybook/react-vite"

import { withChromaticModes } from "@isomer/storybook-config"

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
  parameters: {
    chromatic: withChromaticModes(["desktop", "mobile"]),
  },
  args: {
    links: [
      {
        title: "Irrationality",
        url: "/irrationality",
      },
      {
        title: "For Individuals this is a long long long long long long child",
        url: "/irrationality/individuals",
      },
      {
        title:
          "Steven Pinker's Rationality the quick brown fox jumps over the lazy dog",
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
