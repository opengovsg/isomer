import type { Meta, StoryObj } from "@storybook/react"
import { userEvent, within } from "@storybook/test"
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
  pageHandlers.updatePageBlob.default(),
  pageHandlers.getRootPage.default(),
  pageHandlers.countWithoutRoot.default(),
  sitesHandlers.getLocalisedSitemap.default(),
  sitesHandlers.getTheme.default(),
  sitesHandlers.getConfig.default(),
  sitesHandlers.getFooter.default(),
  sitesHandlers.getNavbar.default(),
  sitesHandlers.getLocalisedSitemap.default(),
  resourceHandlers.getChildrenOf.default(),
  resourceHandlers.getWithFullPermalink.default(),
  resourceHandlers.getAncestryStack.default(),
  resourceHandlers.getBatchAncestryWithSelf.default(),
  resourceHandlers.getMetadataById.content(),
  resourceHandlers.getRolesFor.admin(),
  pageHandlers.readPageAndBlob.content(),
  pageHandlers.readPage.content(),
  pageHandlers.getFullPermalink.content(),
]

const meta: Meta<typeof EditPage> = {
  title: "Pages/Edit Page/Content Page",
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
export const Wordbreak: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", {
      name: /This is a prose block/i,
    })
    await userEvent.click(button)

    const textbox = await canvas.findByRole("textbox")
    await userEvent.type(
      textbox,
      "long words should be preserved: supercalifragilisticexpialidocious",
    )
  },
}

export const EditFixedBlockState: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", {
      name: /Content page header/i,
    })
    await userEvent.click(button)
  },
}

export const SaveToast: Story = {
  play: async ({ canvasElement, ...rest }) => {
    await EditFixedBlockState.play?.({ canvasElement, ...rest })
    const canvas = within(canvasElement)
    const saveButton = await canvas.findByRole("button", {
      name: /Save changes/i,
    })
    await userEvent.click(saveButton)
  },
}

export const AddBlock: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", { name: /add block/i })
    await userEvent.click(button)
  },
}

export const PublishedState: Story = {
  parameters: {
    msw: {
      handlers: [
        pageHandlers.readPage.content({
          state: ResourceState.Published,
          draftBlobId: null,
        }),
        ...COMMON_HANDLERS,
      ],
    },
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

export const AddTextBlock: Story = {
  play: async (context) => {
    const { canvasElement } = context
    const canvas = within(canvasElement)
    await AddBlock.play?.(context)

    await userEvent.click(
      canvas.getByRole("button", { name: /Add a block of text/i }),
    )
  },
}

export const LinkModal: Story = {
  play: async (context) => {
    const { canvasElement } = context
    const canvas = within(canvasElement)
    await AddTextBlock.play?.(context)

    await userEvent.click(canvas.getByRole("button", { name: /link/i }))
  },
}
