import type { Meta, StoryObj } from "@storybook/nextjs"
import { Box } from "@chakra-ui/react"
import { Suspense } from "react"
import { gazetteHandlers } from "tests/msw/handlers/gazette"
import { CreateGazetteModal } from "~/features/gazettes"
import { GazetteSubcategoriesProvider } from "~/features/gazettes/contexts/GazetteSubcategoriesContext"

const meta: Meta<typeof CreateGazetteModal> = {
  args: {
    collectionId: 30,
    isOpen: true,
    onClose: () =>{  console.log("close"); },
    siteId: 1,
  },
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
    chromatic: { delay: 200 },
    layout: "fullscreen",
    msw: {
      handlers: [gazetteHandlers.collectionTags.default()],
    },
  },
  title: "Pages/eGazette/Create Gazette Modal",
}

export default meta

type Story = StoryObj<typeof CreateGazetteModal>

export const Default: Story = {
  name: "Empty Form",
}
