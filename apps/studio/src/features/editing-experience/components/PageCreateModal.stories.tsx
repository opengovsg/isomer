import type { Meta, StoryObj } from "@storybook/react"
import { userEvent, within } from "@storybook/test"

import PageCreateModal from "./PageCreateModal"

const meta: Meta<typeof PageCreateModal> = {
  title: "Components/PageCreateModal",
  component: PageCreateModal,
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
