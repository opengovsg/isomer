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
  resourceHandlers.getRolesFor.admin(),
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
      handlers: [...COMMON_HANDLERS, resourceHandlers.search.initial()],
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
        ...COMMON_HANDLERS,
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
      handlers: [...COMMON_HANDLERS, resourceHandlers.search.results()],
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
      handlers: [...COMMON_HANDLERS, resourceHandlers.search.loading()],
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
      handlers: [...COMMON_HANDLERS, resourceHandlers.search.initial()],
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
      handlers: [...COMMON_HANDLERS, resourceHandlers.search.results()],
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

// Commented out for now because of https://github.com/storybookjs/storybook/issues/25815
// export const ModalOpenOnShortcut: Story = {
//   play: async ({ canvasElement }) => {
//     const canvas = within(canvasElement)
//     await userEvent.keyboard("{Meta>}{k}{/Meta}") // For Mac
//     await userEvent.keyboard("{Control>}{k}{/Control}") // For non-Mac
//   },
// }
