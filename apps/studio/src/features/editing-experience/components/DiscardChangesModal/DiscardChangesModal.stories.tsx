import type { Meta, StoryObj } from "@storybook/nextjs"
import { Box } from "@chakra-ui/react"

import { DiscardChangesModal } from "./DiscardChangesModal"

const meta: Meta<typeof DiscardChangesModal> = {
  title: "Components/DiscardChangesModal",
  component: DiscardChangesModal,
  decorators: [
    (storyFn) => (
      <Box w="100%" h="100vh">
        {storyFn()}
      </Box>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    chromatic: { delay: 200 },
  },
  args: {
    isOpen: true,
    onClose: () => undefined,
    onDiscard: () => undefined,
  },
}

export default meta
type Story = StoryObj<typeof DiscardChangesModal>

export const Default: Story = {}
