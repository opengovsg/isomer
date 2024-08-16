import type { Meta, StoryObj } from "@storybook/react"

import { Checkbox } from "./Checkbox"

const meta: Meta<typeof Checkbox> = {
  title: "Next/Internal Components/Checkbox",
  component: Checkbox,
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
