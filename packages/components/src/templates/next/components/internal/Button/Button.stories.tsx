import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "./Button"

const BUTTON_SIZES = ["sm", "base", "lg"] as const

const meta: Meta<typeof Button> = {
  title: "Next/Internal Components/Button",
  component: Button,
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      {BUTTON_SIZES.map((size) => (
        <Button key={size} {...args} size={size} />
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

export const InverseDefaultButton: Story = {
  decorators: [
    (storyFn) => <div className="bg-base-canvas-inverse p-6">{storyFn()}</div>,
  ],
  args: {
    ...Default.args,
    colorScheme: "inverse",
  },
}

export const InverseOutlineButton: Story = {
  decorators: InverseDefaultButton.decorators,
  args: {
    ...OutlineButton.args,
    colorScheme: "inverse",
  },
}
