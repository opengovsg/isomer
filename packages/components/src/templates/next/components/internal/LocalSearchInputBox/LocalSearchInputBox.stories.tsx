import type { Meta, StoryObj } from "@storybook/react-vite"
import type { LocalSearchProps } from "~/interfaces"

import { LocalSearchInputBox } from "./LocalSearchInputBox"

const meta: Meta<LocalSearchProps> = {
  argTypes: {},
  args: {
    searchUrl: "/search",
  },
  component: LocalSearchInputBox,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Internal Components/LocalSearchInputBox",
}
export default meta
type Story = StoryObj<typeof LocalSearchInputBox>

export const Default: Story = {}
