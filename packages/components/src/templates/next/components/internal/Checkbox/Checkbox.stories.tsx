import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"

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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const checkbox = canvas.getByRole("checkbox")
    const label = checkbox.closest("label")

    // Verify that data-selected attribute is not present when checkbox is not selected
    await expect(label).not.toHaveAttribute("data-selected")
  },
}

export const Checked: Story = {
  args: {
    children:
      "This is a long label that may wrap into a new line; This is a long label that may wrap into a new line;",
    isSelected: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const checkbox = canvas.getByRole("checkbox")
    const label = checkbox.closest("label")

    // Verify that data-selected attribute is present when checkbox is selected
    await expect(label).toHaveAttribute("data-selected", "true")
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
