import type { Meta, StoryObj } from "@storybook/nextjs"
import { Box } from "@chakra-ui/react"
import { ViewGazetteModal } from "~/features/gazettes"

// Use a recent date (within 15 minutes) so the delete button is visible
const recentPublishedAt = new Date()

const meta: Meta<typeof ViewGazetteModal> = {
  args: {
    data: {
      category: "Government Gazette",
      fileId: "26gg5734.pdf",
      notificationNumber: "2145",
      publishedAt: recentPublishedAt,
      subcategory: "Notices under other Acts",
      title: "Limited Liability Partnerships Act 2005 - Section 64",
    },
    gazetteId: "gazette-123",
    initialView: "delete",
    isOpen: true,
    onClose: () =>{  console.log("close"); },
    siteId: 1,
  },
  component: ViewGazetteModal,
  decorators: [
    (storyFn) => (
      <Box w="100%" h="100vh">
        {storyFn()}
      </Box>
    ),
  ],
  parameters: {
    chromatic: { delay: 200 },
    layout: "fullscreen",
  },
  title: "Pages/eGazette/Delete Gazette Modal",
}

export default meta

type Story = StoryObj<typeof ViewGazetteModal>

export const Default: Story = {
  name: "With All Fields",
}

export const WithoutNotificationNumber: Story = {
  args: {
    data: {
      category: "Government Gazette",
      fileId: "abc123.pdf",
      publishedAt: recentPublishedAt,
      subcategory: "Advertisements",
      title: "Another Published Gazette",
    },
  },
  name: "Without Notification Number",
}
