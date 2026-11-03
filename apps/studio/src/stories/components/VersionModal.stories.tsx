import { Box } from "@chakra-ui/react"
import { type Meta, type StoryObj } from "@storybook/nextjs-vite"
import { VersionModal } from "~/components/VersionWrapper/VersionModal"

import { withArgosModes } from "@isomer/storybook-config"

const meta: Meta<typeof VersionModal> = {
  title: "Components/VersionModal",
  component: VersionModal,
  // Required for Argos to know the dimensions of the snapshot to take,
  // since the modal is rendered in a portal and Argos only detects the
  // bounding box of the button that opens the modal.
  decorators: [
    (storyFn) => (
      <Box w="100%" h="100vh">
        {storyFn()}
      </Box>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    // Prevent flaky tests due to modal animating in.
    argos: { delay: 200 },
  },
  args: {
    isOpen: true,
    onClose: () => console.log("close"),
  },
}

export default meta

type Story = StoryObj<typeof VersionModal>

export const Default: Story = {
  name: "VersionModal",
  parameters: {
    argos: withArgosModes(["gsib", "mobile"]),
  },
}
