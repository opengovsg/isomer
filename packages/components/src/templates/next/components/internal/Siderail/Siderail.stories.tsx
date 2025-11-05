import type { Meta, StoryObj } from "@storybook/react-vite"

import type { SiderailProps } from "~/interfaces"
import { Siderail } from "./Siderail"

const meta: Meta<SiderailProps> = {
  title: "Next/Internal Components/Siderail",
  component: Siderail,
  decorators: [(storyFn) => <div className="max-w-sm">{storyFn()}</div>],
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

export const NoSiblings: Story = {
  args: {
    parentTitle: "Alice and Peter Tan Research Grant",
    parentUrl: "/",
    pages: [
      {
        title: "Are you eligible for the research grant?",
        url: "/item-3",
        isCurrent: true,
      },
    ],
  },
}
