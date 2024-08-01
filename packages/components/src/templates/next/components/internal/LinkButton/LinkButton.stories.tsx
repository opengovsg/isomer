import type { Meta, StoryObj } from "@storybook/react"

import LinkButton from "./LinkButton"

const meta: Meta<typeof LinkButton> = {
  title: "Next/Internal Components/LinkButton",
  component: LinkButton,
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
  },
  args: {
    href: "/faq",
  },
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof LinkButton>

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
