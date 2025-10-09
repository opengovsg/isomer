import type { Meta, StoryObj } from "@storybook/react"

import type { PagerProps } from "~/interfaces"
import { Pager } from "./Pager"

const meta: Meta<PagerProps> = {
  title: "Next/Internal Components/Pager",
  component: Pager,
  decorators: [(storyFn) => <div className="max-w-sm">{storyFn()}</div>],
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof Pager>

// Default scenario
export const Default: Story = {
  args: {
    previousPage: {
      title: "Learn about the research grant",
      url: "/item-1",
    },
    nextPage: {
      title: "Apply for the research grant",
      url: "/item-2",
    },
  },
}
