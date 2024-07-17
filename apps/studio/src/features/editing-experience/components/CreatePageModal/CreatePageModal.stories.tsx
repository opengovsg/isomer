import type { Meta, StoryObj } from "@storybook/react"
import { userEvent, within } from "@storybook/test"

import { CreatePageModal } from "./CreatePageModal"

const meta: Meta<typeof CreatePageModal> = {
  title: "Components/CreatePageModal",
  component: CreatePageModal,
  decorators: [],
  args: {
    isOpen: true,
    onClose: () => console.log("onClose"),
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const AutogeneratePageUrl: Story = {
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)
    const inputElement = screen.getByText(/page title/i)
    await userEvent.type(inputElement, "My_new page WITH w@eird characters!")
  },
}
