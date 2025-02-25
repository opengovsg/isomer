import type { Meta, StoryObj } from "@storybook/react"

import { LinkButton } from "./LinkButton"

const BUTTON_SIZES = ["base", "lg"] as const

const meta: Meta<typeof LinkButton> = {
  title: "Next/Internal Components/LinkButton",
  component: LinkButton,
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      {BUTTON_SIZES.map((size) => (
        <LinkButton key={size} {...args} size={size} />
      ))}
    </div>
  ),
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
    children: "slightly longer (link) button text",
  },
}

export const ExternalLink: Story = {
  args: {
    ...Default.args,
    href: "https://www.google.com",
  },
}

export const OutlineVariant: Story = {
  args: {
    ...Default.args,
    variant: "outline",
  },
}

export const InverseDefaultVariant: Story = {
  decorators: [
    (storyFn) => <div className="bg-base-canvas-inverse p-6">{storyFn()}</div>,
  ],
  args: {
    ...Default.args,
    colorScheme: "inverse",
  },
}

export const InverseOutlineVariant: Story = {
  decorators: InverseDefaultVariant.decorators,
  args: {
    ...OutlineVariant.args,
    colorScheme: "inverse",
  },
}
