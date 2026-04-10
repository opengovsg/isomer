import { Box } from "@chakra-ui/react"
import { type Meta, type StoryObj } from "@storybook/nextjs"
import { expect, userEvent, within } from "storybook/test"
import { RiskyFileUploadModal } from "~/components/PageEditor/RiskyFileUploadModal"

import { withChromaticModes } from "@isomer/storybook-config"

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
    chromatic: {
      delay: 200,
      ...withChromaticModes(["gsib", "desktop"]),
    },
  },
  args: {
    isOpen: true,
    onClose: () => console.log("onClose"),
    onConfirm: () => console.log("onConfirm"),
    file: new File([], "document.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
  },
  argTypes: {
    file: {
      description:
        "File being uploaded; extension is derived for the modal copy.",
    },
  },
}

export default meta

type Story = StoryObj<typeof RiskyFileUploadModal>

export const Default: Story = {
  name: "RiskyFileUploadModal",
}

export const ErrorState: Story = {
  name: "RiskyFileUploadModal (checkbox error)",
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      await screen.findByRole("button", { name: "Upload file" }),
    )
    const errorMessage = await screen.findByText(
      "You must accept the risks to upload the file.",
    )
    await expect(errorMessage).toBeVisible()
  },
}
