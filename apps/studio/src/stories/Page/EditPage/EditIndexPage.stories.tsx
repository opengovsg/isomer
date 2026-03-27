import type { Meta, StoryObj } from "@storybook/nextjs"
import { ResourceState } from "~prisma/generated/generatedEnums"
import { userEvent, within } from "storybook/test"
import { folderHandlers } from "tests/msw/handlers/folder"
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
  sitesHandlers.getTheme.default(),
  sitesHandlers.getConfig.default(),
  sitesHandlers.getFooter.default(),
  sitesHandlers.getNavbar.default(),
  resourceHandlers.getChildrenOf.default(),
  resourceHandlers.getAncestryStack.default(),
  resourceHandlers.getBatchAncestryWithSelf.default(),
  resourceHandlers.getRolesFor.admin(),
  folderHandlers.listChildPages.default(),
  // NOTE: Handlers that return custom data for this story
  sitesHandlers.getLocalisedSitemap.index(),
  resourceHandlers.getWithFullPermalink.index(),
  resourceHandlers.getMetadataById.index(),
  pageHandlers.readPageAndBlob.index(),
  pageHandlers.readPage.index(),
  pageHandlers.getFullPermalink.index(),
  sitesHandlers.getLocalisedSitemap.index(),
]

const meta: Meta<typeof EditPage> = {
  title: "Pages/Edit Page/Index Page",
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

export const EditFixedBlockState: Story = {
  parameters: { disableMockDate: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", {
      name: /Header/i,
    })
    await userEvent.click(button)
  },
}

export const SaveToast: Story = {
  parameters: { disableMockDate: true },
  play: async ({ canvasElement, ...rest }) => {
    await EditFixedBlockState.play?.({ canvasElement, ...rest })
    const canvas = within(canvasElement)

    const textbox = await canvas.findByPlaceholderText("Page summary")
    await userEvent.type(textbox, "very cool summary")

    const saveButton = await canvas.findByRole("button", {
      name: /Save changes/i,
    })
    await userEvent.click(saveButton)
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

export const EditChildBlockState: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", {
      name: /Child pages/i,
    })
    await userEvent.click(button)
  },
}

export const CustomIndexPage: Story = {
  parameters: {
    msw: {
      handlers: [
        pageHandlers.readPageAndBlob.customIndex(),
        ...COMMON_HANDLERS,
      ],
    },
  },
}

export const EditInfocardsLinkState: Story = {
  parameters: {
    msw: {
      handlers: [
        pageHandlers.readPageAndBlob.indexWithInfocards(),
        pageHandlers.getPrefill.default(),
        ...COMMON_HANDLERS,
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Click on the infocards block
    const infocardsBlock = await canvas.findByRole("button", {
      name: /Info cards block/i,
    })
    await userEvent.click(infocardsBlock)

    // Click on the first card item
    const firstCard = await canvas.findByRole("button", {
      name: /First card/i,
    })
    await userEvent.click(firstCard)


    const textboxes = await canvas.findAllByRole("textbox")
    textboxes.forEach(async (textbox) => {
      await userEvent.clear(textbox) 
    })

    const deleteButton= await canvas.findByRole("button", {
      name: /Remove file/i,
    })
    await userEvent.click(deleteButton)

    // Click on the "Link something..." button to open the modal
    const linkButton = await canvas.findByRole("button", {
      name: /Link something/i,
    })
    await userEvent.click(linkButton)

    // Modal renders in a portal outside canvasElement, so query from document.body
    const body = within(document.body)
    const page = await body.findByText("Page 1")
    await userEvent.click(page)

    const addLinkButton= await body.findByRole("button", {
      name: /Add link/i,
    })
    await userEvent.click(addLinkButton)
  },
}
