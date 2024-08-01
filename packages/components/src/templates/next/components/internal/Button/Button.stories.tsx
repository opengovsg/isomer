import type { Meta, StoryObj } from "@storybook/react"

import { Button } from "./Button"

const meta: Meta<typeof Button> = {
  title: "Next/Internal Components/Button",
  component: Button,
  argTypes: {
    colorScheme: {
      options: ["default", "inverse"],
      control: {
        type: "select",
      },
    },
    variant: {
      options: ["solid", "outline"],
      control: {
        type: "select",
      },
    },
    size: {
      options: ["base", "lg"],
      control: {
        type: "select",
      },
    },
  },
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof Button>

// Default scenario
export const Default: Story = {
  args: {
    children: "Work with us",
  },
}

export const LongerButtonText: Story = {
  args: {
    children: "slightly longer button text",
  },
}

export const OutlineButton: Story = {
  args: {
    ...Default.args,
    variant: "outline",
  },
}
