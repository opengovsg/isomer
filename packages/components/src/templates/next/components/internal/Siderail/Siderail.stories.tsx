import type { Meta, StoryObj } from "@storybook/react-vite"
import type { SiderailProps } from "~/interfaces"

import { Siderail } from "./Siderail"

const meta: Meta<SiderailProps> = {
  argTypes: {},
  component: Siderail,
  decorators: [(storyFn) => <div className="max-w-sm">{storyFn()}</div>],
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Internal Components/Siderail",
}
export default meta
type Story = StoryObj<typeof Siderail>

// Default scenario
export const Default: Story = {
  args: {
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
        isCurrent: true,
        title: "Are you eligible for the research grant?",
        url: "/item-3",
      },
      {
        title: "FAQs on research grant",
        url: "/item-4",
      },
    ],
    parentTitle: "Alice and Peter Tan Research Grant",
    parentUrl: "/",
  },
}

export const NoSiblings: Story = {
  args: {
    pages: [
      {
        isCurrent: true,
        title: "Are you eligible for the research grant?",
        url: "/item-3",
      },
    ],
    parentTitle: "Alice and Peter Tan Research Grant",
    parentUrl: "/",
  },
}
