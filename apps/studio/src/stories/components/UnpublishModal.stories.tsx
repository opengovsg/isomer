import type { Meta, StoryObj } from "@storybook/nextjs"
import { Box, useDisclosure } from "@chakra-ui/react"
import { useEffect } from "react"
import { userEvent, within } from "storybook/test"
import { pageHandlers } from "tests/msw/handlers/page"
import { PublishOrUnpublishModal } from "~/features/editing-experience/components/PublishOrUnpublishModal"
import { ADMIN_HANDLERS } from "~/stories/handlers"
import { ResourceType } from "~prisma/generated/generatedEnums"

// The modal takes a disclosure via props rather than reading an atom, so a
// small wrapper opens it on mount for the story.
const OpenedUnpublishModal = ({
  hasDraftChanges = false,
  containerType,
}: {
  hasDraftChanges?: boolean
  containerType?: ResourceType
}): JSX.Element => {
  const disclosure = useDisclosure()
  useEffect(() => {
    disclosure.onOpen()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <PublishOrUnpublishModal
      action="unpublish"
      pageId={1}
      siteId={1}
      hasDraftChanges={hasDraftChanges}
      containerType={containerType}
      {...disclosure}
    />
  )
}

const meta: Meta<typeof PublishOrUnpublishModal> = {
  title: "Components/UnpublishModal",
  component: PublishOrUnpublishModal,
  // The modal renders in a portal; give Chromatic a bounding box to snapshot.
  decorators: [
    (storyFn) => (
      <Box w="100%" h="100vh">
        {storyFn()}
      </Box>
    ),
  ],
  render: () => <OpenedUnpublishModal />,
  parameters: {
    layout: "fullscreen",
    // Prevent flaky snapshots while the modal animates in.
    chromatic: { delay: 200 },
    msw: {
      handlers: [
        ...ADMIN_HANDLERS,
        pageHandlers.readPage.content(),
        pageHandlers.unpublishPage.default(),
        pageHandlers.scheduleUnpublish.default(),
      ],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Neither option selected yet — the CTA is disabled.
export const Default: Story = {}

// The page has unsaved draft changes — shows the "will be kept" disclaimer.
export const WithDraftChanges: Story = {
  render: () => <OpenedUnpublishModal hasDraftChanges />,
}

// "Unpublish now" selected — the CTA activates.
export const UnpublishNowSelected: Story = {
  play: async ({ canvasElement }) => {
    const rootScreen = within(canvasElement.ownerDocument.body)
    const [unpublishNowRadio] = await rootScreen.findAllByRole("radio")
    if (unpublishNowRadio) {
      await userEvent.click(unpublishNowRadio)
    }
  },
}

// "Unpublish later" selected — reveals the date/time fields.
export const UnpublishLaterSelected: Story = {
  play: async ({ canvasElement }) => {
    const rootScreen = within(canvasElement.ownerDocument.body)
    const radios = await rootScreen.findAllByRole("radio")
    const laterRadio = radios[1]
    if (laterRadio) {
      await userEvent.click(laterRadio)
    }
  },
}

// "Unpublish later" selected on a Folder's landing page — shows the "child
// pages must also be unpublished by this time" disclaimer, worded for a folder.
export const UnpublishLaterSelectedOnFolderLandingPage: Story = {
  render: () => <OpenedUnpublishModal containerType={ResourceType.Folder} />,
  play: async (context) => {
    await UnpublishLaterSelected.play?.(context)
  },
}

// Same as above, but on a Collection's landing page — the disclaimer wording
// switches to "collection".
export const UnpublishLaterSelectedOnCollectionLandingPage: Story = {
  render: () => (
    <OpenedUnpublishModal containerType={ResourceType.Collection} />
  ),
  play: async (context) => {
    await UnpublishLaterSelected.play?.(context)
  },
}

// "Unpublish now" submitted — the CTA shows its loading state.
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        ...ADMIN_HANDLERS,
        pageHandlers.readPage.content(),
        pageHandlers.unpublishPage.loading(),
        pageHandlers.scheduleUnpublish.default(),
      ],
    },
  },
  play: async (context) => {
    await UnpublishNowSelected.play?.(context)

    const rootScreen = within(context.canvasElement.ownerDocument.body)
    const submitButton = await rootScreen.findByRole("button", {
      name: "Unpublish now",
    })
    await userEvent.click(submitButton, { pointerEventsCheck: 0 })
  },
}
