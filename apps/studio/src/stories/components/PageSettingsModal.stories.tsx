import type { Meta, StoryObj } from "@storybook/nextjs"
import { Box } from "@chakra-ui/react"
import { useSetAtom } from "jotai"
import { useEffect } from "react"
import { expect, userEvent, within } from "storybook/test"
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

// readPage supplies the title and (here) a published page, so the redirect
// option can surface; getPermalinkTree.withParent makes the page live at
// /newsroom/collection-page, which is the path checked against redirects.
const BASE_HANDLERS = [
  ...ADMIN_HANDLERS,
  // Published page so the "Redirect page automatically" option can appear when
  // the URL changes (RedirectOptionShown).
  pageHandlers.readPage.homepage({
    title: "Contact us",
    publishedVersionId: "1",
    state: "Published",
  }),
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
// the redirect would shadow this page.
export const UrlIsRedirectSource: Story = {
  parameters: {
    msw: {
      handlers: [...BASE_HANDLERS, redirectHandlers.getBySource.existing()],
    },
  },
}

// The existing redirect points back at this page, so the warning is suppressed
// (saving auto-clears it).
export const UrlRedirectsToThisPage: Story = {
  parameters: {
    msw: {
      handlers: [...BASE_HANDLERS, redirectHandlers.getBySource.toResource()],
    },
  },
}

// Changing the URL reveals the "Redirect page automatically" option.
export const RedirectOptionShown: Story = {
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const urlInput = await body.findByPlaceholderText(
      "URL will be autopopulated if left untouched",
    )
    await userEvent.clear(urlInput)
    await userEvent.type(urlInput, "renamed-page")
  },
}

// An unpublished page has no live URL to preserve, so changing its URL must NOT
// offer the redirect option even though the URL changed.
export const UnpublishedPageHidesRedirectOption: Story = {
  parameters: {
    msw: {
      handlers: [
        ...ADMIN_HANDLERS,
        pageHandlers.readPage.homepage({
          title: "Contact us",
          publishedVersionId: null,
          state: "Draft",
        }),
        pageHandlers.getPermalinkTree.withParent(),
        redirectHandlers.getBySource.none(),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const urlInput = await body.findByPlaceholderText(
      "URL will be autopopulated if left untouched",
    )
    await userEvent.clear(urlInput)
    await userEvent.type(urlInput, "renamed-page")
    // The "Redirect page automatically" option must not appear.
    await expect(body.queryByText("Redirect page automatically")).toBeNull()
    // The publish warning must not appear for a page that hasn't been published.
    await expect(body.queryByText(/will get published immediately/)).toBeNull()
    // The confirm button should say "Save", not "Publish immediately".
    await body.findByRole("button", { name: "Save" })
  },
}
