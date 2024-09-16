import type { Meta, StoryObj } from "@storybook/react"
import { userEvent, waitFor, within } from "@storybook/test"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"

import EditPage from "~/pages/sites/[siteId]/pages/[pageId]"

const COMMON_HANDLERS = [
  meHandlers.me(),
  pageHandlers.listWithoutRoot.default(),
  pageHandlers.getRootPage.default(),
  pageHandlers.countWithoutRoot.default(),
  sitesHandlers.getLocalisedSitemap.default(),
  sitesHandlers.getTheme.default(),
  sitesHandlers.getConfig.default(),
  sitesHandlers.getFooter.default(),
  sitesHandlers.getNavbar.default(),
  resourceHandlers.getChildrenOf.default(),
  resourceHandlers.getMetadataById.homepage(),
  pageHandlers.readPageAndBlob.homepage(),
  pageHandlers.readPage.homepage(),
  pageHandlers.getFullPermalink.homepage(),
]

const meta: Meta<typeof EditPage> = {
  title: "Pages/Edit Page/Home Page",
  component: EditPage,
  parameters: {
    getLayout: EditPage.getLayout,
    msw: {
      handlers: COMMON_HANDLERS,
    },
    nextjs: {
      router: {
        query: {
          siteId: "1",
          pageId: "1",
        },
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof EditPage>

export const Default: Story = {}

export const AddBlock: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await waitFor(async () => {
      await userEvent.click(canvas.getByRole("button", { name: /add block/i }))
    })
  },
}

export const EditHero: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await waitFor(async () => {
      await userEvent.click(
        canvas.getByRole("button", { name: /hero banner/i }),
      )
    })
  },
}

export const PublishedState: Story = {
  parameters: {
    msw: {
      handlers: [
        pageHandlers.readPage.homepage({
          state: "Published",
          draftBlobId: null,
        }),
        ...COMMON_HANDLERS,
      ],
    },
  },
}

export const NestedState: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await waitFor(async () => {
      await userEvent.click(
        canvas.getByRole("button", { name: /keystatistics/i }),
      )
      await userEvent.click(
        canvas.getByRole("button", { name: /average all nighters/i }),
      )
    })
  },
}

export const ErrorNestedState: Story = {
  play: async (context) => {
    await NestedState.play?.(context)

    const { canvasElement } = context
    const canvas = within(canvasElement)

    await waitFor(async () => {
      await userEvent.clear(
        canvas.getByRole("textbox", { name: /description/i }),
      )

      await userEvent.click(canvas.getByLabelText(/return to statistics/i))
    })
  },
}
