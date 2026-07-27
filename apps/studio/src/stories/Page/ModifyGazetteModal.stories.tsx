import type { Meta, StoryObj } from "@storybook/nextjs"
import { Box } from "@chakra-ui/react"
import { Suspense } from "react"
import { gazetteHandlers } from "tests/msw/handlers/gazette"
import { ModifyGazetteModal } from "~/features/gazettes"
import { GazetteSubcategoriesProvider } from "~/features/gazettes/contexts/GazetteSubcategoriesContext"

const meta: Meta<typeof ModifyGazetteModal> = {
  title: "Pages/eGazette/Modify Gazette Modal",
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
    layout: "fullscreen",
    chromatic: { delay: 200 },
    msw: {
      handlers: [gazetteHandlers.collectionTags.default()],
    },
  },
  args: {
    isOpen: true,
    onClose: () => console.log("close"),
    gazetteId: "gazette-123",
    siteId: 1,
    collectionId: 30,
    initialData: {
      title: "Sample Gazette Title",
      category: "government-gazette",
      subcategory: "advertisements",
      notificationNumber: "123/2025",
      publishDate: new Date("2025-06-15"),
      publishTime: "09:00",
      fileId: "sample-gazette.pdf",
      fileName: "sample-gazette.pdf",
      fileSize: 1024000,
    },
  },
}

export default meta

type Story = StoryObj<typeof ModifyGazetteModal>

export const Default: Story = {
  name: "With Pre-filled Data",
}

export const WithoutNotificationNumber: Story = {
  name: "Without Notification Number",
  args: {
    initialData: {
      title: "Another Gazette",
      category: "government-gazette",
      subcategory: "notices-under-other-acts",
      publishDate: new Date("2025-07-01"),
      publishTime: "14:00",
      fileId: "another-gazette.pdf",
    },
  },
}
