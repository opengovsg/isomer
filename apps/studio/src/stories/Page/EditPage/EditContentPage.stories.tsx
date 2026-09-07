import type { Meta, StoryObj } from "@storybook/nextjs"
import { expect, userEvent, within } from "storybook/test"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"
import EditPage from "~/pages/sites/[siteId]/pages/[pageId]"
import { createBannerGbParameters } from "~/stories/utils/growthbook"
import { ResourceState } from "~prisma/generated/generatedEnums"

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
  title: "Pages/Edit Page/Content Page",
}

export default meta
type Story = StoryObj<typeof EditPage>

export const Default: Story = {}
export const Wordbreak: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", {
      name: /This is a prose block/iu,
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
      name: /Content page header/iu,
    })
    await userEvent.click(button)
  },
}

export const SaveToast: Story = {
  play: async ({ canvasElement, ...rest }) => {
    await EditFixedBlockState.play?.({ canvasElement, ...rest })
    const canvas = within(canvasElement)
    const saveButton = await canvas.findByRole("button", {
      name: /Save changes/iu,
    })
    await userEvent.click(saveButton)
  },
}

export const AddBlock: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", { name: /add block/iu })
    await userEvent.click(button)
  },
}

export const PublishedState: Story = {
  parameters: {
    msw: {
      handlers: [
        pageHandlers.readPage.content({
          draftBlobId: null,
          state: ResourceState.Published,
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
        message: "This is a test banner",
        variant: "info",
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
      canvas.getByRole("button", {
        name: /Add text, links, lists, and tables./iu,
      }),
    )
  },
}

export const LinkModal: Story = {
  play: async (context) => {
    const { canvasElement } = context
    const canvas = within(canvasElement)
    await AddTextBlock.play?.(context)

    await userEvent.click(canvas.getByRole("button", { name: /link/iu }))
  },
}

export const AddTable: Story = {
  play: async (context) => {
    const { canvasElement } = context
    const canvas = within(canvasElement)
    await AddTextBlock.play?.(context)

    await userEvent.click(
      await canvas.findByRole("button", { name: /^table$/iu }),
    )
  },
}

export const ActiveTableToolbar: Story = {
  play: async (context) => {
    const { canvasElement } = context
    const canvas = within(canvasElement)
    await AddTextBlock.play?.(context)

    // Outside a table: superscript/subscript live only under "More options".
    // (The page also has an unrelated page-actions "More options" `Menu`
    // button; the RTE toolbar's overflow list is a `Popover`, so
    // disambiguate on aria-haspopup.)
    const overflowTrigger = canvas
      .getAllByRole("button", { name: /more options/iu })
      .find((button) => button.getAttribute("aria-haspopup") === "dialog")
    if (!overflowTrigger) {
      throw new Error("Overflow trigger not found")
    }
    await userEvent.click(overflowTrigger)
    await canvas.findByRole("button", { name: /^superscript$/i })
    await expect(
      canvas.queryAllByRole("button", { name: /^superscript$/i }),
    ).toHaveLength(1)
    await userEvent.keyboard("{Escape}")

    // Clicking "Table" only opens the size-picker popover — a cell still
    // needs to be picked to actually insert a table and put the cursor
    // inside it (see TableSizePicker.tsx).
    await userEvent.click(canvas.getByRole("button", { name: /^table$/iu }))
    await userEvent.click(
      await canvas.findByRole("button", { name: /^1 by 1 table$/iu }),
    )

    // Inside a table: promoted directly onto the main toolbar, and no longer
    // duplicated under "More options" (removed from that list entirely).
    await canvas.findByRole("button", { name: /^superscript$/i })
    await canvas.findByRole("button", { name: /^subscript$/i })
    await expect(
      canvas.getAllByRole("button", { name: /^superscript$/i }),
    ).toHaveLength(1)

    // Divider is also table-inapplicable, so "More options" has nothing left
    // to show and disappears entirely — only the unrelated page-actions menu
    // button remains.
    await expect(
      canvas.getAllByRole("button", { name: /more options/iu }),
    ).toHaveLength(1)
  },
}
