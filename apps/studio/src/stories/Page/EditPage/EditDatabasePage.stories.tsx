import type { Meta, StoryObj } from "@storybook/react"
import { expect, userEvent, waitFor, within } from "@storybook/test"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"

import EditPage from "~/pages/sites/[siteId]/pages/[pageId]"

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
  resourceHandlers.getMetadataById.database(),
  pageHandlers.readPageAndBlob.database(),
  pageHandlers.readPage.database(),
  pageHandlers.getFullPermalink.database(),
  resourceHandlers.getRolesFor.admin(),
]

const meta: Meta<typeof EditPage> = {
  title: "Pages/Edit Page/Database Page",
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

export const EditFixedBlockHeader: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", {
      name: /Page header/i,
    })
    await userEvent.click(button)
  },
}

export const EditFixedBlockDatabase: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", {
      name: /Database/i,
    })
    await userEvent.click(button)
  },
}

export const DatabaseModal: Story = {
  play: async ({ canvasElement, ...rest }) => {
    await EditFixedBlockDatabase.play?.({ canvasElement, ...rest })
    const screen = within(canvasElement.ownerDocument.body)

    const editButton = await screen.findByRole("button", { name: /edit/i })
    await userEvent.click(editButton)

    await screen.findByText(/Valid CSV dataset/)
  },
}

export const DatabaseModalEmptyString: Story = {
  play: async ({ canvasElement, ...rest }) => {
    await DatabaseModal.play?.({ canvasElement, ...rest })
    const screen = within(canvasElement.ownerDocument.body)

    const input = Array.from(
      canvasElement.ownerDocument.querySelectorAll(
        'input[name="datasetId"][required]',
      ),
    )[0]
    if (input) {
      await waitFor(
        async () => {
          await expect(input).not.toBeDisabled()
        },
        { timeout: 3000 },
      )
      await userEvent.clear(input)
    }

    await screen.findByText("Dataset URL is required")
  },
}

export const DatabaseModalInvalidDatasetUrl: Story = {
  play: async ({ canvasElement, ...rest }) => {
    await DatabaseModalEmptyString.play?.({ canvasElement, ...rest })
    const screen = within(canvasElement.ownerDocument.body)

    const input = await screen.findByPlaceholderText("Paste dataset URL here")
    await userEvent.type(input, "https://studio.isomer.gov.sg/")

    await screen.findByText(
      "This doesn't look like a valid link from data.gov.sg. Check that you have the correct link and try again.",
    )
  },
}

export const DatabaseModalValidSearchUrl: Story = {
  play: async ({ canvasElement, ...rest }) => {
    await DatabaseModalEmptyString.play?.({ canvasElement, ...rest })
    const screen = within(canvasElement.ownerDocument.body)

    const input = await screen.findByPlaceholderText("Paste dataset URL here")
    await userEvent.type(
      input,
      "https://data.gov.sg/datasets?sort=downloadsCount&resultId=d_11e68bba3b3c76733475a72d09759eeb&page=1",
    )

    await screen.findByText(/Valid CSV dataset/)
  },
}

export const DatabaseModalValidDatasetId: Story = {
  play: async ({ canvasElement, ...rest }) => {
    await DatabaseModalEmptyString.play?.({ canvasElement, ...rest })
    const screen = within(canvasElement.ownerDocument.body)

    const input = await screen.findByPlaceholderText("Paste dataset URL here")
    await userEvent.type(input, "d_3f960c10fed6145404ca7b821f263b87")

    await screen.findByText(/Valid CSV dataset/)
  },
}

export const DatabaseModalNonCsvDataset: Story = {
  play: async ({ canvasElement, ...rest }) => {
    await DatabaseModalEmptyString.play?.({ canvasElement, ...rest })
    const screen = within(canvasElement.ownerDocument.body)

    const input = await screen.findByPlaceholderText("Paste dataset URL here")
    await userEvent.type(
      input,
      "https://data.gov.sg/datasets/d_e25662f1a062dd046453926aa284ba64/view",
    )

    await screen.findByText(
      "You can only link CSV datasets. Please check the dataset ID and try again.",
    )
  },
}
