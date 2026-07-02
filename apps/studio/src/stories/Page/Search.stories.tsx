import type { Meta, StoryObj } from "@storybook/nextjs"
import { expect, userEvent, within } from "storybook/test"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import SitePage from "~/pages/sites/[siteId]"
import { MAX_SEARCH_QUERY_LENGTH } from "~/schemas/resource"

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
]

const meta: Meta<typeof SitePage> = {
  title: "Pages/Site Management/Search",
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

export const Initial: Story = {
  parameters: {
    msw: {
      handlers: [...SHARED_HANDLERS, resourceHandlers.search.initial()],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const searchButton = await screen.findByRole("button", {
      name: "search-button",
    })
    await userEvent.click(searchButton)
  },
}

export const WithRecentlyViewed: Story = {
  parameters: {
    msw: {
      handlers: [
        ...SHARED_HANDLERS,
        resourceHandlers.search.initial(),
        resourceHandlers.searchWithResourceIds.default(),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const searchButton = await screen.findByRole("button", {
      name: "search-button",
    })
    await userEvent.click(searchButton)
  },
}

export const Results: Story = {
  parameters: {
    msw: {
      handlers: [...SHARED_HANDLERS, resourceHandlers.search.results()],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const searchButton = await screen.findByRole("button", {
      name: "search-button",
    })
    await userEvent.click(searchButton)
    await userEvent.keyboard("covid test")
  },
}

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [...SHARED_HANDLERS, resourceHandlers.search.loading()],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const searchButton = await screen.findByRole("button", {
      name: "search-button",
    })
    await userEvent.click(searchButton)
    await userEvent.keyboard("covid test")
  },
}

export const NoResults: Story = {
  parameters: {
    msw: {
      handlers: [...SHARED_HANDLERS, resourceHandlers.search.initial()],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const searchButton = await screen.findByRole("button", {
      name: "search-button",
    })
    await userEvent.click(searchButton)
    await userEvent.keyboard("fwnjebjesnlckgebjeb")
  },
}

export const ShowHint: Story = {
  parameters: {
    msw: {
      handlers: [...SHARED_HANDLERS, resourceHandlers.search.results()],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const searchButton = await screen.findByRole("button", {
      name: "search-button",
    })
    await userEvent.click(searchButton)
    await userEvent.keyboard("covid")
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await userEvent.keyboard(" test")
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await userEvent.keyboard(" 1")
  },
}

export const QueryTooLong: Story = {
  parameters: {
    msw: {
      handlers: [...SHARED_HANDLERS, resourceHandlers.search.initial()],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const searchButton = await screen.findByRole("button", {
      name: "search-button",
    })
    await userEvent.click(searchButton)
    await userEvent.paste("a".repeat(MAX_SEARCH_QUERY_LENGTH + 1))
    const modal = within(canvasElement.ownerDocument.body)
    await expect(
      modal.getByText(
        "Your search is a bit long — try shortening it a little.",
      ),
    ).toBeVisible()
  },
}

export const ExcessiveWords: Story = {
  parameters: {
    msw: {
      handlers: [...SHARED_HANDLERS, resourceHandlers.search.results()],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const searchButton = await screen.findByRole("button", {
      name: "search-button",
    })
    await userEvent.click(searchButton)
    await userEvent.keyboard(
      "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11",
    )
    const modal = within(canvasElement.ownerDocument.body)
    await expect(
      modal.getByText("Showing results for the first 10 words only."),
    ).toBeVisible()
  },
}

// Commented out for now because of https://github.com/storybookjs/storybook/issues/25815
// export const ModalOpenOnShortcut: Story = {
//   play: async ({ canvasElement }) => {
//     const canvas = within(canvasElement)
//     await userEvent.keyboard("{Meta>}{k}{/Meta}") // For Mac
//     await userEvent.keyboard("{Control>}{k}{/Control}") // For non-Mac
//   },
// }
