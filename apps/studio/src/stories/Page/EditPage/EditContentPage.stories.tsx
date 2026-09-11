import type { Meta, StoryObj } from "@storybook/nextjs"
import type { Editor } from "@tiptap/react"
import { expect, userEvent, waitFor, within } from "storybook/test"
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

/** TipTap BubbleMenu portals into the story iframe body. */
function withinPortals(canvasElement: HTMLElement) {
  return within(canvasElement.ownerDocument.body)
}

// Document position at the start of the nth table cell (tableCell /
// tableHeader), 0-indexed in reading order. Used to forge a CellSelection
// in play functions. Storybook can't drive a real mouse drag across cells.
const nthCellPos = (editor: Editor, index: number): number => {
  let seen = 0
  let found: number | null = null
  editor.state.doc.descendants((node, pos) => {
    if (found !== null) return false
    if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
      if (seen === index) {
        found = pos
        return false
      }
      seen += 1
    }
    return true
  })
  if (found === null) {
    throw new Error(`Could not find cell at index ${index}`)
  }
  return found
}

const getEditorFromCanvas = (canvasElement: HTMLElement): Editor => {
  const proseMirrorEl = canvasElement.querySelector<
    HTMLElement & { editor?: Editor }
  >(".ProseMirror")
  const editor = proseMirrorEl?.editor
  if (!editor) throw new Error("Editor did not mount")
  return editor
}

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
      canvas.getByRole("button", {
        name: /Add text, links, lists, and tables./i,
      }),
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

export const AddTable: Story = {
  play: async (context) => {
    const { canvasElement } = context
    const canvas = within(canvasElement)
    await AddTextBlock.play?.(context)

    await userEvent.click(
      await canvas.findByRole("button", { name: /^table$/i }),
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
      .getAllByRole("button", { name: /more options/i })
      .find((button) => button.getAttribute("aria-haspopup") === "dialog")
    if (!overflowTrigger) throw new Error("Overflow trigger not found")
    await userEvent.click(overflowTrigger)
    await canvas.findByRole("button", { name: /^superscript$/i })
    await expect(
      canvas.queryAllByRole("button", { name: /^superscript$/i }),
    ).toHaveLength(1)
    await userEvent.keyboard("{Escape}")

    // Clicking "Table" only opens the size-picker popover. A cell still
    // needs to be picked to actually insert a table and put the cursor
    // inside it (see TableSizePicker.tsx).
    await userEvent.click(canvas.getByRole("button", { name: /^table$/i }))
    await userEvent.click(
      await canvas.findByRole("button", { name: /^1 by 1 table$/i }),
    )

    // Inside a table: promoted directly onto the main toolbar, and no longer
    // duplicated under "More options" (removed from that list entirely).
    await canvas.findByRole("button", { name: /^superscript$/i })
    await canvas.findByRole("button", { name: /^subscript$/i })
    await expect(
      canvas.getAllByRole("button", { name: /^superscript$/i }),
    ).toHaveLength(1)

    // Divider is also table-inapplicable, so "More options" has nothing left
    // to show and disappears entirely. Only the unrelated page-actions menu
    // button remains.
    await expect(
      canvas.getAllByRole("button", { name: /more options/i }),
    ).toHaveLength(1)
  },
}

// Navigate into a text block, insert a table, select a body row. The
// contextual TableBubbleMenu should appear with row actions.
export const TableBubbleMenu: Story = {
  play: async (context) => {
    const { canvasElement } = context
    const canvas = within(canvasElement)
    await AddTextBlock.play?.(context)

    // Clicking "Table" only opens the size-picker popover. A cell still
    // needs to be picked to actually insert a table (see TableSizePicker.tsx).
    await userEvent.click(canvas.getByRole("button", { name: /^table$/i }))
    await userEvent.click(
      await canvas.findByRole("button", { name: /^3 by 3 table$/i }),
    )

    await waitFor(() =>
      expect(canvasElement.querySelector("table")).toBeTruthy(),
    )

    const editor = getEditorFromCanvas(canvasElement)
    // Default insertTable is 3x3 with a header row; cells 3-5 are the first body row.
    editor
      .chain()
      .focus()
      .setCellSelection({
        anchorCell: nthCellPos(editor, 3),
        headCell: nthCellPos(editor, 5),
      })
      .run()

    const portals = withinPortals(canvasElement)
    // Row/column actions live behind the portaled pencil trigger. Click to open.
    await userEvent.click(
      await portals.findByRole("button", { name: "Table actions" }),
    )

    await waitFor(() =>
      expect(portals.getByText("Delete row")).toBeInTheDocument(),
    )
    await expect(portals.getByText("Add row above")).toBeInTheDocument()
  },
}
