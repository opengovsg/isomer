import type { Meta, StoryObj } from "@storybook/react-vite"
import { BiSearch } from "react-icons/bi"

import { IconButton } from "./IconButton"

const meta: Meta<typeof IconButton> = {
  title: "Next/Internal Components/IconButton",
  component: IconButton,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof IconButton>

export const Default: Story = {
  args: {
    icon: BiSearch,
  },
}
