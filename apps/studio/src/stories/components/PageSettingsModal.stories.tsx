import type { Meta, StoryObj } from "@storybook/nextjs"
import { Box } from "@chakra-ui/react"
import { useSetAtom } from "jotai"
import { useEffect } from "react"
import { pageHandlers } from "tests/msw/handlers/page"
import { redirectHandlers } from "tests/msw/handlers/redirect"
import { pageSettingsModalAtom } from "~/features/dashboard/atoms"
import { PageSettingsModal } from "~/features/dashboard/components/PageSettingsModal"
import { ADMIN_HANDLERS } from "~/stories/handlers"
import { ResourceType } from "~prisma/generated/generatedEnums"

// The modal is opened by its jotai atom rather than a prop, so a small wrapper
// opens it on mount for the story.
const OpenedPageSettingsModal = (): JSX.Element => {
  const setState = useSetAtom(pageSettingsModalAtom)
  useEffect(() => {
    setState({ pageId: "1", type: ResourceType.Page })
  }, [setState])
  return <PageSettingsModal />
}

// readPage supplies the title; getPermalinkTree.withParent makes the page live
// at /newsroom/collection-page, which is the path checked against redirects.
const BASE_HANDLERS = [
  ...ADMIN_HANDLERS,
  pageHandlers.readPage.homepage({ title: "Contact us" }),
  pageHandlers.getPermalinkTree.withParent(),
]

const meta: Meta<typeof PageSettingsModal> = {
  title: "Components/PageSettingsModal",
  component: PageSettingsModal,
  // The modal renders in a portal; give Chromatic a bounding box to snapshot.
  decorators: [
    (storyFn) => (
      <Box w="100%" h="100vh">
        {storyFn()}
      </Box>
    ),
  ],
  render: () => <OpenedPageSettingsModal />,
  parameters: {
    layout: "fullscreen",
    // Prevent flaky snapshots while the modal animates in.
    chromatic: { delay: 200 },
    nextjs: { router: { query: { siteId: "1" } } },
    msw: { handlers: [...BASE_HANDLERS, redirectHandlers.getBySource.none()] },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// The URL is not a redirect source — no warning is shown.
export const Default: Story = {}

// The URL is already a redirect source — a non-blocking warning tells the user
// the redirect would shadow this page (ISOM-2266).
export const UrlIsRedirectSource: Story = {
  parameters: {
    msw: {
      handlers: [...BASE_HANDLERS, redirectHandlers.getBySource.existing()],
    },
  },
}
