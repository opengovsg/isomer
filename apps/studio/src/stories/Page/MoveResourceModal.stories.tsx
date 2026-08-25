import type { Meta, StoryObj } from "@storybook/nextjs"
import { expect, userEvent, within } from "storybook/test"
import { pageHandlers } from "tests/msw/handlers/page"
import { redirectHandlers } from "tests/msw/handlers/redirect"
import { resourceHandlers } from "tests/msw/handlers/resource"
import SitePage from "~/pages/sites/[siteId]"

import { ADMIN_HANDLERS } from "../handlers"

// Split out so the move-validation stories can swap in their own
// `getMetadataById` mock instead of the generic `content()` one.
const SHARED_HANDLERS_WITHOUT_METADATA = [
  ...ADMIN_HANDLERS,
  pageHandlers.listWithoutRoot.default(),
  pageHandlers.getRootPage.default(),
  pageHandlers.countWithoutRoot.default(),
  pageHandlers.readPage.content(),
  pageHandlers.updateSettings.collection(),
  pageHandlers.getPermalinkTree.withParent(),
  resourceHandlers.getChildrenOf.default(),
  resourceHandlers.getWithFullPermalink.default(),
  resourceHandlers.getAncestryStack.default(),
]

const SHARED_HANDLERS = [
  ...SHARED_HANDLERS_WITHOUT_METADATA,
  resourceHandlers.getMetadataById.content(),
]

const meta: Meta<typeof SitePage> = {
  title: "Pages/Site Management/Move Resource Modal",
  component: SitePage,
  parameters: {
    getLayout: SitePage.getLayout,
    nextjs: {
      router: {
        query: {
          siteId: "1",
        },
      },
    },
  },
  decorators: [],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        ...SHARED_HANDLERS,
        resourceHandlers.getBatchAncestryWithSelf.foldersOnly(),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const pageMenuButton = await screen.findByRole("button", {
      name: "Options for Test page 1",
    })
    await userEvent.click(pageMenuButton)

    const moveButton = (
      await within(canvasElement.ownerDocument.body).findByText("Move to...")
    ).closest("button")
    if (!moveButton) throw new Error("Move button not found")
    await userEvent.click(moveButton)
  },
}

export const SingleClick: Story = {
  parameters: {
    msw: {
      handlers: [
        ...SHARED_HANDLERS,
        resourceHandlers.getBatchAncestryWithSelf.foldersOnly(),
        redirectHandlers.getBySource.none(),
      ],
    },
  },
  play: async (context) => {
    const { canvasElement } = context
    await Default.play?.(context)

    const folder1 = (
      await within(canvasElement.ownerDocument.body).findByText("Folder 1")
    ).closest("button")
    if (!folder1) throw new Error("Folder 1 not found")
    await userEvent.click(folder1)
  },
}

export const EmptyFolder: Story = {
  parameters: {
    msw: {
      handlers: [
        ...SHARED_HANDLERS,
        resourceHandlers.getBatchAncestryWithSelf.noResults(),
      ],
    },
  },
  play: async (context) => {
    await Default.play?.(context)
  },
}

const SearchTemplate: Story = {
  play: async (context) => {
    const { canvasElement } = context
    await Default.play?.(context)

    const searchButton = await within(
      canvasElement.ownerDocument.body,
    ).findByPlaceholderText(
      "Search pages, collections, or folders by name, or choose from the list below",
    )
    await userEvent.click(searchButton)
  },
}

export const Search: Story = {
  parameters: {
    msw: {
      handlers: [
        ...SHARED_HANDLERS,
        resourceHandlers.getBatchAncestryWithSelf.foldersOnly(),
      ],
    },
  },
  play: async (context) => {
    await SearchTemplate.play?.(context)

    await userEvent.keyboard("folder")
  },
}

export const SearchLoading: Story = {
  parameters: {
    msw: {
      handlers: [
        ...SHARED_HANDLERS,
        resourceHandlers.getBatchAncestryWithSelf.foldersOnly(),
        resourceHandlers.search.loading(),
      ],
    },
  },
  play: async (context) => {
    await SearchTemplate.play?.(context)

    await userEvent.keyboard("folder")
  },
}

export const SearchNoResults: Story = {
  parameters: {
    msw: {
      handlers: [
        ...SHARED_HANDLERS,
        resourceHandlers.getBatchAncestryWithSelf.noResults(),
      ],
    },
  },
  play: async (context) => {
    await SearchTemplate.play?.(context)

    await userEvent.keyboard("deiofrehioferhfioehfe")
  },
}

// Selecting a destination reveals the redirect option; a redirect already at
// the new URL surfaces a shadow warning.
export const RedirectShadowWarning: Story = {
  parameters: {
    msw: {
      handlers: [
        ...SHARED_HANDLERS,
        resourceHandlers.getBatchAncestryWithSelf.foldersOnly(),
        redirectHandlers.getBySource.existing(),
      ],
    },
  },
  play: async (context) => {
    await SingleClick.play?.(context)
  },
}

// Collection items (CollectionPage/CollectionLink) may only be moved to
// another collection — isResourceMoveValid rejects a plain folder as the
// destination, and the modal should surface that error instead of allowing
// the move.
export const CollectionItemInvalidDestination: Story = {
  parameters: {
    msw: {
      handlers: [
        ...SHARED_HANDLERS_WITHOUT_METADATA,
        resourceHandlers.getBatchAncestryWithSelf.foldersOnly(),
        // "Test page 1" (id 4) is mocked as a CollectionPage here so it can
        // be moved via the ordinary root dashboard listing without a real
        // collection fixture; "Folder 1" (id 1) is the invalid destination.
        resourceHandlers.getMetadataById.byId({
          "4": {
            id: "4",
            type: "CollectionPage",
            title: "Test page 1",
            permalink: "test-page-1",
            parentId: null,
            siteId: 1,
            publishedVersionId: null,
          },
          "1": {
            id: "1",
            type: "Folder",
            title: "Folder 1",
            permalink: "folder-1",
            parentId: null,
            siteId: 1,
            publishedVersionId: null,
          },
        }),
      ],
    },
  },
  play: async (context) => {
    const { canvasElement } = context
    await SingleClick.play?.(context)

    await within(canvasElement.ownerDocument.body).findByText(
      "Collection items can only be moved to another collection",
    )
  },
}

// Clicking the "Home" row sets the site root as the move destination — the
// row itself should pick up the same selected styling a regular folder row
// gets once it's the chosen destination.
export const HomeSelected: Story = {
  parameters: {
    msw: {
      handlers: [
        ...SHARED_HANDLERS,
        resourceHandlers.getBatchAncestryWithSelf.foldersOnly(),
      ],
    },
  },
  play: async (context) => {
    const { canvasElement } = context
    await Default.play?.(context)

    // Scoped to the dialog: the underlying dashboard page also renders a
    // "Home" link in its sidebar, so an unscoped query matches more than
    // one element.
    const dialog = await within(canvasElement.ownerDocument.body).findByRole(
      "dialog",
    )
    const homeRow = await within(dialog).findByText("Home")
    await userEvent.click(homeRow)

    await expect(homeRow.closest("[data-selected]")).not.toBeNull()
  },
}
