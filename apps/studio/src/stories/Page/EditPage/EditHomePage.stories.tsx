import type { Meta, StoryObj } from "@storybook/nextjs"
import { expect, userEvent, within } from "storybook/test"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"
import EditPage from "~/pages/sites/[siteId]/pages/[pageId]"
import {
  createAntiScamBannerEnabledGbParameters,
  createBannerGbParameters,
} from "~/stories/utils/growthbook"
import { ResourceState } from "~prisma/generated/generatedEnums"

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
  component: EditPage,
  parameters: {
    getLayout: EditPage.getLayout,
    msw: {
      handlers: COMMON_HANDLERS,
    },
    nextjs: {
      router: {
        pathname: "/sites/[siteId]/pages/[pageId]",
        query: {
          pageId: "1",
          siteId: "1",
        },
      },
    },
  },
  title: "Pages/Edit Page/Home Page",
}

export default meta
type Story = StoryObj<typeof EditPage>

export const Default: Story = {}

export const AddBlock: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", { name: /add block/iu })
    await userEvent.click(button)
  },
}

export const EditHero: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", { name: /hero banner/iu })
    await userEvent.click(button)
  },
}

export const SaveToast: Story = {
  play: async ({ canvasElement, ...rest }) => {
    await EditHero.play?.({ canvasElement, ...rest })
    const canvas = within(canvasElement)
    const saveButton = await canvas.findByRole("button", {
      name: /Save changes/iu,
    })
    await userEvent.click(saveButton)
  },
}

export const EditKeyStatistics: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", {
      name: /Statistics/iu,
    })
    await userEvent.click(button)
  },
}

export const PublishedState: Story = {
  parameters: {
    msw: {
      handlers: [
        pageHandlers.readPage.homepage({
          draftBlobId: null,
          state: ResourceState.Published,
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
      name: /statistics/iu,
    })
    await userEvent.click(keyStatisticsButton)

    const averageAllNightersButton = await canvas.findByRole("button", {
      name: /average all nighters/iu,
    })
    await userEvent.click(averageAllNightersButton)
  },
}

export const ErrorNestedState: Story = {
  parameters: {
    disableMockDate: true,
    // Disable mockDateDecorator to prevent interference with error state
  },
  play: async (context) => {
    await NestedState.play?.(context)

    const { canvasElement } = context
    const canvas = within(canvasElement)

    const textbox = await canvas.findByRole("textbox", {
      name: /description/iu,
    })
    await userEvent.clear(textbox)

    const returnToStatisticsButton =
      await canvas.findByLabelText(/return to statistics/iu)
    await userEvent.click(returnToStatisticsButton)
  },
}

export const FullscreenPreview: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Required since menu is a portal
    // oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
    const screen = within(canvasElement.parentElement!)

    const button = await canvas.findByRole(
      "button",
      { name: /default mode/iu },
      { timeout: 10_000 },
    )
    await userEvent.click(button)

    const text = await screen.findByText(/full screen/iu)
    await userEvent.click(text)
  },
}

export const WithBanner: Story = {
  parameters: {
    growthbook: [
      createBannerGbParameters({
        message: "This is a test banner",
        variant: "info",
      }),
    ],
  },
}

export const AddAntiScamDisclaimerSaveBlockEnabled: Story = {
  parameters: {
    growthbook: [createAntiScamBannerEnabledGbParameters(true)],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const addBlockButton = await canvas.findByRole("button", {
      name: /add block/iu,
    })
    await userEvent.click(addBlockButton)
    const antiScamBlockType = await canvas.findByRole("button", {
      name: /anti-scam disclaimer/iu,
    })
    await userEvent.click(antiScamBlockType)
    const saveBlockButton = await canvas.findByRole("button", {
      name: /save block/iu,
    })
    await expect(saveBlockButton).not.toBeDisabled()
  },
}

export const ReopenAntiScamDisclaimerSaveBlockDisabled: Story = {
  parameters: {
    growthbook: [createAntiScamBannerEnabledGbParameters(true)],
  },
  play: async ({ canvasElement, ...rest }) => {
    await AddAntiScamDisclaimerSaveBlockEnabled.play?.({
      canvasElement,
      ...rest,
    })
    const canvas = within(canvasElement)
    const saveAfterAdd = await canvas.findByRole("button", {
      name: /save block/iu,
    })
    await userEvent.click(saveAfterAdd)
    const antiScamBlockRow = await canvas.findByRole("button", {
      name: /anti-scam disclaimer/iu,
    })
    await userEvent.click(antiScamBlockRow)
    const saveAfterReopen = await canvas.findByRole("button", {
      name: /save block/iu,
    })
    await expect(saveAfterReopen).toBeDisabled()
  },
}
