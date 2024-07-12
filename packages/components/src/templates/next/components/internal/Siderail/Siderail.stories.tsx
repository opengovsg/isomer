import type { Meta, StoryObj } from "@storybook/react"

import type { SiderailProps } from "~/interfaces"
import Siderail from "./Siderail"

const meta: Meta<SiderailProps> = {
  title: "Next/Internal Components/Siderail",
  component: Siderail,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof Siderail>

// Default scenario
export const Default: Story = {
  args: {
    parentTitle: "Alice and Peter Tan Research Grant",
    parentUrl: "/",
    pages: [
      {
        title: "Learn about the research grant",
        url: "/item-1",
      },
      {
        title: "Apply for the research grant",
        url: "/item-2",
        childPages: [
          {
            title: "Child that will not be shown",
            url: "/item-2-1",
          },
          {
            title: "Child that will not be shown",
            url: "/item-2-2",
          },
          {
            title: "Child that will not be shown",
            url: "/item-2-3",
          },
        ],
      },
      {
        title: "Are you eligible for the research grant?",
        url: "/item-3",
        isCurrent: true,
        childPages: [
          {
            title: "Eligibility criteria",
            url: "/item-3-1",
          },
          {
            title: "Application process",
            url: "/item-3-2",
          },
          {
            title: "Child page with a long long title",
            url: "/item-3-2",
          },
        ],
      },
      {
        title: "FAQs on research grant",
        url: "/item-4",
      },
    ],
  },
}

export const NoChildren: Story = {
  args: {
    parentTitle: "Alice and Peter Tan Research Grant",
    parentUrl: "/",
    pages: [
      {
        title: "Learn about the research grant",
        url: "/item-1",
      },
      {
        title: "Apply for the research grant",
        url: "/item-2",
      },
      {
        title: "Are you eligible for the research grant?",
        url: "/item-3",
        isCurrent: true,
      },
      {
        title: "FAQs on research grant",
        url: "/item-4",
      },
    ],
  },
}
