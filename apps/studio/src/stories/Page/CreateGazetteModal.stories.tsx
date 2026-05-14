import type { Meta, StoryObj } from "@storybook/nextjs"
import { Box } from "@chakra-ui/react"
import { CreateGazetteModal } from "~/features/gazettes"

const meta: Meta<typeof CreateGazetteModal> = {
  title: "Pages/eGazette/Create Gazette Modal",
  component: CreateGazetteModal,
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
    onClose: () => console.log("close"),
    siteId: 1,
    collectionId: 30,
  },
}

export default meta

type Story = StoryObj<typeof CreateGazetteModal>

export const Default: Story = {
  name: "Empty Form",
}
