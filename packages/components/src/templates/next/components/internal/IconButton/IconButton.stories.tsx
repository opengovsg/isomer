import type { Meta, StoryObj } from "@storybook/react-vite"
import { BiSearch } from "react-icons/bi"

import { IconButton } from "./IconButton"

const meta: Meta<typeof IconButton> = {
  component: IconButton,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Internal Components/IconButton",
}
export default meta
type Story = StoryObj<typeof IconButton>

export const Default: Story = {
  args: {
    icon: BiSearch,
  },
}
