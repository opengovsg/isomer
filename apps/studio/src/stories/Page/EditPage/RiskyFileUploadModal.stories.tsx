import { Box } from "@chakra-ui/react"
import { type Meta, type StoryObj } from "@storybook/nextjs"

import { withChromaticModes } from "@isomer/storybook-config"

import { RiskyFileUploadModal } from "~/components/PageEditor/RiskyFileUploadModal"

const meta: Meta<typeof RiskyFileUploadModal> = {
  title: "Pages/Edit Page/RiskyFileUploadModal",
  component: RiskyFileUploadModal,
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
    onClose: () => {},
    onConfirm: () => {},
    fileExtension: ".docx",
  },
  argTypes: {
    fileExtension: {
      control: "text",
      description: "Shown in the modal copy (e.g. .docx, .xlsx).",
    },
  },
}

export default meta

type Story = StoryObj<typeof RiskyFileUploadModal>

export const Default: Story = {
  name: "RiskyFileUploadModal",
  parameters: {
    chromatic: withChromaticModes(["gsib", "mobile"]),
  },
}
