import type { Meta, StoryObj } from "@storybook/nextjs"
import { delay, http, HttpResponse } from "msw"
import { userEvent, within } from "storybook/test"
import { assetHandler } from "tests/msw/handlers/asset"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import PageSettings from "~/pages/sites/[siteId]/pages/[pageId]/settings"
import { createBannerGbParameters } from "~/stories/utils/growthbook"
import { ASSETS_BASE_URL } from "~/utils/generateAssetUrl"

const uploadHandler = {
  default: () =>
    http.put("/storybook/upload", async () => {
      await delay()
      return HttpResponse.json()
    }),
}

const imageHandler = {
  default: (delayMs?: number | "infinite") =>
    http.get(`${ASSETS_BASE_URL}/MOCK_STORYBOOK_ASSET`, async () => {
      await delay(delayMs)
      return await fetch(
        "https://i.natgeofe.com/n/548467d8-c5f1-4551-9f58-6817a8d2c45e/NationalGeographic_2572187_3x2.jpg",
      )
    }),
}

const COMMON_HANDLERS = [
  meHandlers.me(),
  resourceHandlers.getMetadataById.content(),
  resourceHandlers.getRolesFor.admin(),
  pageHandlers.readPageAndBlob.content(),
  pageHandlers.readPage.content(),
  pageHandlers.getFullPermalink.content(),
  assetHandler.getPresignedPutUrl.default(),
  uploadHandler.default(),
  imageHandler.default(),
]

const meta: Meta<typeof PageSettings> = {
  component: PageSettings,
  parameters: {
    getLayout: PageSettings.getLayout,
    msw: {
      handlers: COMMON_HANDLERS,
    },
    nextjs: {
      router: {
        pathname: "/sites/[siteId]/pages/[pageId]/settings",
        query: {
          pageId: "1",
          siteId: "1",
        },
      },
    },
  },
  title: "Pages/Edit Page/Settings",
}

export default meta
type Story = StoryObj<typeof PageSettings>

export const Root: Story = {
  parameters: {
    msw: {
      handlers: [
        pageHandlers.getPermalinkTree.root(),
        pageHandlers.readPageAndBlob.homepage(),
        pageHandlers.readPage.homepage(),
        resourceHandlers.getMetadataById.homepage(),
        ...COMMON_HANDLERS,
      ],
    },
  },
}

export const WithParent: Story = {
  parameters: {
    msw: {
      handlers: [
        pageHandlers.getPermalinkTree.withParent(),
        ...COMMON_HANDLERS,
      ],
    },
  },
}

export const WithGrandparent: Story = {
  parameters: {
    msw: {
      handlers: [
        pageHandlers.getPermalinkTree.withGrandParent(),
        ...COMMON_HANDLERS,
      ],
    },
  },
}

export const WithBanner: Story = {
  parameters: {
    ...Root.parameters,
    growthbook: [
      createBannerGbParameters({
        message: "This is a warning test banner",
        variant: "warn",
      }),
    ],
  },
}

export const FilePicker: Story = {
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const button = await screen.findByRole("button", { name: /Choose file/i })

    await userEvent.click(button)
  },
}

export const ImageLoading: Story = {
  parameters: {
    msw: {
      handlers: [imageHandler.default("infinite"), ...COMMON_HANDLERS],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const fileInput = await screen.findByTestId("file-upload")

    await userEvent.upload(
      fileInput,
      new File([], "file.jpg", { type: "image/jpeg" }),
    )
  },
}

export const ImageLoaded: Story = {
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const fileInput = await screen.findByTestId("file-upload")

    await userEvent.upload(
      fileInput,
      new File([], "file.jpg", { type: "image/jpeg" }),
    )
  },
}
