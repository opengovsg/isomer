import type { Meta, StoryObj } from "@storybook/nextjs"
import { Box } from "@chakra-ui/react"
import { Suspense } from "react"
import { gazetteHandlers } from "tests/msw/handlers/gazette"
import { CreateGazetteModal } from "~/features/gazettes"
import { GazetteSubcategoriesProvider } from "~/features/gazettes/contexts/GazetteSubcategoriesContext"

const meta: Meta<typeof CreateGazetteModal> = {
  title: "Pages/eGazette/Create Gazette Modal",
  component: CreateGazetteModal,
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
    siteId: 1,
    collectionId: 30,
  },
}

export default meta

type Story = StoryObj<typeof CreateGazetteModal>

export const Default: Story = {
  name: "Empty Form",
}
