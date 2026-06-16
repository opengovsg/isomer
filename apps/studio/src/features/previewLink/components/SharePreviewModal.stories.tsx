import type { Meta, StoryObj } from "@storybook/nextjs"
import { Box } from "@chakra-ui/react"

import { SharePreviewModal } from "./SharePreviewModal"

const meta: Meta<typeof SharePreviewModal> = {
  title: "Features/PreviewLink/SharePreviewModal",
  component: SharePreviewModal,
  decorators: [
    (storyFn) => (
      <Box w="100%" h="100vh">
        {storyFn()}
      </Box>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    isOpen: true,
    onClose: () => {
      // no-op for the story
    },
    siteId: 1,
    resourceId: 1,
  },
}

export default meta

type Story = StoryObj<typeof SharePreviewModal>

export const InitialForm: Story = {}

export const Closed: Story = {
  args: {
    isOpen: false,
  },
}
