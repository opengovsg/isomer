import type { Meta, StoryObj } from "@storybook/nextjs"
import { Box } from "@chakra-ui/react"
import { ViewGazetteModal } from "~/features/gazettes"

const meta: Meta<typeof ViewGazetteModal> = {
  title: "Pages/eGazette/Delete Gazette Modal",
  component: ViewGazetteModal,
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
    gazetteId: "gazette-123",
    initialView: "delete",
    data: {
      title: "Limited Liability Partnerships Act 2005 - Section 64",
      category: "Government Gazette",
      subcategory: "Notices under other Acts",
      notificationNumber: "2145",
      fileId: "26gg5734.pdf",
      publishedAt: "17/04/2026, 05:55PM",
    },
  },
}

export default meta

type Story = StoryObj<typeof ViewGazetteModal>

export const Default: Story = {
  name: "With All Fields",
}

export const WithoutNotificationNumber: Story = {
  name: "Without Notification Number",
  args: {
    data: {
      title: "Another Published Gazette",
      category: "Government Gazette",
      subcategory: "Advertisements",
      fileId: "abc123.pdf",
      publishedAt: "01/01/2026, 09:00AM",
    },
  },
}
