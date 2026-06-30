import type { Meta, StoryObj } from "@storybook/nextjs"
import { userEvent, within } from "storybook/test"
import { pageHandlers } from "tests/msw/handlers/page"
import { redirectHandlers } from "tests/msw/handlers/redirect"
import { resourceHandlers } from "tests/msw/handlers/resource"
import SitePage from "~/pages/sites/[siteId]"

import { ADMIN_HANDLERS } from "../handlers"

const SHARED_HANDLERS = [
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
