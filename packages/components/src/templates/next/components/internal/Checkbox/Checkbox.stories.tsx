import type { Meta, StoryObj } from "@storybook/react-vite"

import { Checkbox } from "./Checkbox"

const meta: Meta<typeof Checkbox> = {
  title: "Next/Internal Components/Checkbox",
  component: Checkbox,
  decorators: [
    (Story) => (
      <div className="max-w-screen-xs">
        <Story />
      </div>
    ),
  ],
  args: {
    children: "Checkbox",
    isDisabled: false,
  },
}

export default meta

type Story = StoryObj<typeof Checkbox>

export const Default: Story = {
  args: {},
}

export const Checked: Story = {
  args: {
    children:
      "This is a long label that may wrap into a new line; This is a long label that may wrap into a new line;",
    isSelected: true,
  },
}

export const Indeterminate: Story = {
  args: {
    isIndeterminate: true,
  },
}

export const Disabled: Story = {
  args: {
    isDisabled: true,
  },
}
