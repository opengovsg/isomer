import type { Meta, StoryObj } from "@storybook/nextjs"
import { Box } from "@chakra-ui/react"
import { Suspense } from "react"
import { gazetteHandlers } from "tests/msw/handlers/gazette"
import { ModifyGazetteModal } from "~/features/gazettes"
import { GazetteSubcategoriesProvider } from "~/features/gazettes/contexts/GazetteSubcategoriesContext"

const meta: Meta<typeof ModifyGazetteModal> = {
  args: {
    collectionId: 30,
    gazetteId: "gazette-123",
    initialData: {
      category: "government-gazette",
      fileId: "sample-gazette.pdf",
      fileName: "sample-gazette.pdf",
      fileSize: 1_024_000,
      notificationNumber: "123/2025",
      publishDate: new Date("2025-06-15"),
      publishTime: "09:00",
      subcategory: "advertisements",
      title: "Sample Gazette Title",
    },
    isOpen: true,
    onClose: () => {
      console.log("close")
    },
    siteId: 1,
  },
  component: ModifyGazetteModal,
  decorators: [
    (storyFn, { args }) => (
      <Box w="100%" h="100vh">
        <Suspense fallback={null}>
          <GazetteSubcategoriesProvider
            siteId={args.siteId}
            gazettesCollectionId={args.collectionId}
          >
            {storyFn()}
          </GazetteSubcategoriesProvider>
        </Suspense>
      </Box>
    ),
  ],
  parameters: {
    chromatic: { delay: 200 },
    layout: "fullscreen",
    msw: {
      handlers: [gazetteHandlers.collectionTags.default()],
    },
  },
  title: "Pages/eGazette/Modify Gazette Modal",
}

export default meta

type Story = StoryObj<typeof ModifyGazetteModal>

export const Default: Story = {
  name: "With Pre-filled Data",
}

export const WithoutNotificationNumber: Story = {
  args: {
    initialData: {
      category: "government-gazette",
      fileId: "another-gazette.pdf",
      publishDate: new Date("2025-07-01"),
      publishTime: "14:00",
      subcategory: "notices-under-other-acts",
      title: "Another Gazette",
    },
  },
  name: "Without Notification Number",
}
