import type { Meta, StoryObj } from "@storybook/nextjs"
import { userEvent, within } from "storybook/test"
import { ResourceState } from "~prisma/generated/generatedEnums"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"

import EditPage from "~/pages/sites/[siteId]/pages/[pageId]"
import { createBannerGbParameters } from "~/stories/utils/growthbook"

const COMMON_HANDLERS = [
  meHandlers.me(),
  pageHandlers.listWithoutRoot.default(),
  pageHandlers.getRootPage.default(),
  pageHandlers.updatePageBlob.default(),
  pageHandlers.countWithoutRoot.default(),
  sitesHandlers.getLocalisedSitemap.default(),
  sitesHandlers.getTheme.default(),
  sitesHandlers.getConfig.default(),
  sitesHandlers.getFooter.default(),
  sitesHandlers.getNavbar.default(),
  sitesHandlers.getLocalisedSitemap.default(),
  resourceHandlers.getChildrenOf.default(),
  resourceHandlers.getMetadataById.homepage(),
  pageHandlers.readPageAndBlob.homepage(),
  pageHandlers.readPage.homepage(),
  pageHandlers.getFullPermalink.homepage(),
  resourceHandlers.getRolesFor.admin(),
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
        pathname: "/sites/[siteId]/pages/[pageId]",
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
    const button = await canvas.findByRole("button", { name: /add block/i })
    await userEvent.click(button)
  },
}

export const EditHero: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", { name: /hero banner/i })
    await userEvent.click(button)
  },
}

export const SaveToast: Story = {
  play: async ({ canvasElement, ...rest }) => {
    await EditHero.play?.({ canvasElement, ...rest })
    const canvas = within(canvasElement)
    const saveButton = await canvas.findByRole("button", {
      name: /Save changes/i,
    })
    await userEvent.click(saveButton)
  },
}

export const EditKeyStatistics: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", {
      name: /KeyStatistics Component/i,
    })
    await userEvent.click(button)
  },
}

export const PublishedState: Story = {
  parameters: {
    msw: {
      handlers: [
        pageHandlers.readPage.homepage({
          state: ResourceState.Published,
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

    const keyStatisticsButton = await canvas.findByRole("button", {
      name: /keystatistics/i,
    })
    await userEvent.click(keyStatisticsButton)

    const averageAllNightersButton = await canvas.findByRole("button", {
      name: /average all nighters/i,
    })
    await userEvent.click(averageAllNightersButton)
  },
}

export const ErrorNestedState: Story = {
  play: async (context) => {
    await NestedState.play?.(context)

    const { canvasElement } = context
    const canvas = within(canvasElement)

    const textbox = await canvas.findByRole("textbox", { name: /description/i })
    await userEvent.clear(textbox)

    const returnToStatisticsButton =
      await canvas.findByLabelText(/return to statistics/i)
    await userEvent.click(returnToStatisticsButton)
  },
}

export const FullscreenPreview: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Required since menu is a portal
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const screen = within(canvasElement.parentElement!)

    const button = await canvas.findByRole("button", { name: /default mode/i })
    await userEvent.click(button)

    const text = await screen.findByText(/full screen/i)
    await userEvent.click(text)
  },
}

export const WithBanner: Story = {
  parameters: {
    growthbook: [
      createBannerGbParameters({
        variant: "info",
        message: "This is a test banner",
      }),
    ],
  },
}
