import type { Meta, StoryObj } from "@storybook/react"
import { userEvent, within } from "@storybook/test"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"

import SitePage from "~/pages/sites/[siteId]"

const COMMON_HANDLERS = [
  meHandlers.me(),
  pageHandlers.listWithoutRoot.default(),
  pageHandlers.getRootPage.default(),
  pageHandlers.countWithoutRoot.default(),
  pageHandlers.readPage.content(),
  pageHandlers.updateSettings.collection(),
  pageHandlers.getPermalinkTree.withParent(),
  sitesHandlers.getSiteName.default(),
  resourceHandlers.getChildrenOf.default(),
  resourceHandlers.getRolesFor.default(),
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
        ...COMMON_HANDLERS,
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
        ...COMMON_HANDLERS,
        resourceHandlers.getBatchAncestryWithSelf.foldersOnly(),
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
        ...COMMON_HANDLERS,
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
        ...COMMON_HANDLERS,
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
        ...COMMON_HANDLERS,
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
        ...COMMON_HANDLERS,
        resourceHandlers.getBatchAncestryWithSelf.noResults(),
      ],
    },
  },
  play: async (context) => {
    await SearchTemplate.play?.(context)

    await userEvent.keyboard("deiofrehioferhfioehfe")
  },
}
