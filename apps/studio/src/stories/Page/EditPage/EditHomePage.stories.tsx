import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import mockdate from "mockdate"
import { http, HttpResponse } from "msw"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { assetHandler } from "tests/msw/handlers/asset"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"
import EditPage from "~/pages/sites/[siteId]/pages/[pageId]"
import { createBannerGbParameters } from "~/stories/utils/growthbook"
import { ASSETS_BASE_URL } from "~/utils/generateAssetUrl"
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
      name: /Statistics/i,
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
      name: /statistics/i,
    })
    await userEvent.click(keyStatisticsButton)

    const averageAllNightersButton = await canvas.findByRole("button", {
      name: /average all nighters/i,
    })
    await userEvent.click(averageAllNightersButton)
  },
}

export const ErrorNestedState: Story = {
  parameters: {
    disableMockDate: true, // Disable mockDateDecorator to prevent interference with error state
  },
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
    // oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
    const screen = within(canvasElement.parentElement!)

    const button = await canvas.findByRole(
      "button",
      { name: /default mode/i },
      { timeout: 10000 },
    )
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

export const AddAntiScamDisclaimerSaveBlockEnabled: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const addBlockButton = await canvas.findByRole("button", {
      name: /add block/i,
    })
    await userEvent.click(addBlockButton)
    const antiScamBlockType = await canvas.findByRole("button", {
      name: /anti-scam disclaimer/i,
    })
    await userEvent.click(antiScamBlockType)
    const saveBlockButton = await canvas.findByRole("button", {
      name: /save block/i,
    })
    await expect(saveBlockButton).not.toBeDisabled()
  },
}

export const ReopenAntiScamDisclaimerSaveBlockDisabled: Story = {
  play: async ({ canvasElement, ...rest }) => {
    await AddAntiScamDisclaimerSaveBlockEnabled.play?.({
      canvasElement,
      ...rest,
    })
    const canvas = within(canvasElement)
    const saveAfterAdd = await canvas.findByRole("button", {
      name: /save block/i,
    })
    await userEvent.click(saveAfterAdd)
    const antiScamBlockRow = await canvas.findByRole("button", {
      name: /anti-scam disclaimer/i,
    })
    await userEvent.click(antiScamBlockRow)
    const saveAfterReopen = await canvas.findByRole("button", {
      name: /save block/i,
    })
    await expect(saveAfterReopen).toBeDisabled()
  },
}

// Regression: uploading a hero image used to crash the form with "Maximum
// update depth exceeded" because the hero's combinator controls rebuilt their
// render infos (and so the image control's uischema) on every render.
export const HeroImageUpload: Story = {
  parameters: {
    // Frozen time stalls JsonForms' debounced onChange, so the upload would
    // never reach the preview.
    disableMockDate: true,
    msw: {
      handlers: [
        assetHandler.getPresignedPutUrl.default(),
        http.put("/storybook/upload", () => new HttpResponse(null)),
        http.get(
          `${ASSETS_BASE_URL}/MOCK_STORYBOOK_ASSET`,
          () => new HttpResponse(null),
        ),
        ...COMMON_HANDLERS,
      ],
    },
  },
  // disableMockDate only skips freezing, so clear any date an earlier story
  // froze.
  beforeEach: () => {
    mockdate.reset()
  },
  play: async ({ canvasElement, ...rest }) => {
    await EditHero.play?.({ canvasElement, ...rest })
    const canvas = within(canvasElement)

    const currentImageRow = (await canvas.findByText("hero-banner.png"))
      .parentElement
    if (!currentImageRow) throw new Error("Hero image row not rendered")
    await userEvent.click(
      within(currentImageRow).getByRole("button", { name: "Remove file" }),
    )
    const fileInput = await waitFor(() => {
      const input =
        canvasElement.querySelector<HTMLInputElement>('input[type="file"]')
      if (!input) throw new Error("File input not rendered")
      return input
    })
    await userEvent.upload(
      fileInput,
      new File(["hero"], "hero.png", { type: "image/png" }),
    )

    await expect(
      await canvas.findByText("MOCK_STORYBOOK_ASSET", undefined, {
        timeout: 5000,
      }),
    ).toBeVisible()
    await waitFor(
      () => {
        const previewImages = Array.from(
          canvasElement
            .querySelector("iframe")
            ?.contentDocument?.querySelectorAll("img") ?? [],
        )
        return expect(
          previewImages.some((img) =>
            img.getAttribute("src")?.endsWith("/MOCK_STORYBOOK_ASSET"),
          ),
        ).toBe(true)
      },
      { timeout: 5000 },
    )
  },
}
