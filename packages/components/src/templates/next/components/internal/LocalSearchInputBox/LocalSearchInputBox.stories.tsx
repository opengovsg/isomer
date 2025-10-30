import type { Meta, StoryObj } from "@storybook/react-vite"

import type { LocalSearchProps } from "~/interfaces"
import LocalSearchInputBox from "./LocalSearchInputBox"

const meta: Meta<LocalSearchProps> = {
  title: "Next/Internal Components/LocalSearchInputBox",
  component: LocalSearchInputBox,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  args: {
    searchUrl: "/search",
  },
}
export default meta
type Story = StoryObj<typeof LocalSearchInputBox>

export const Default: Story = {}
