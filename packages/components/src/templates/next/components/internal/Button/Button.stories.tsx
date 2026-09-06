import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "./Button"

const BUTTON_SIZES = ["sm", "base", "lg"] as const

const meta: Meta<typeof Button> = {
  argTypes: {
    colorScheme: {
      control: {
        type: "select",
      },
      options: ["default", "inverse"],
    },
    variant: {
      control: {
        type: "select",
      },
      options: ["solid", "outline"],
    },
  },
  component: Button,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      {BUTTON_SIZES.map((size) => (
        <Button key={size} {...args} size={size} />
      ))}
    </div>
  ),
  title: "Next/Internal Components/Button",
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
  args: {
    ...Default.args,
    colorScheme: "inverse",
  },
  decorators: [
    (storyFn) => <div className="bg-base-canvas-inverse p-6">{storyFn()}</div>,
  ],
}

export const InverseOutlineButton: Story = {
  args: {
    ...OutlineButton.args,
    colorScheme: "inverse",
  },
  decorators: InverseDefaultButton.decorators,
}
