// @vitest-environment jsdom
import type {
  IsomerComponent,
  IsomerSchema,
} from "@opengovsg/isomer-components"
import type { Root } from "react-dom/client"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { getComponentSchema } from "@opengovsg/isomer-components"
import { act, useEffect } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { BLOCK_TO_META } from "~/components/PageEditor/constants"
import {
  EditorDrawerProvider,
  useEditorDrawerContext,
} from "~/contexts/EditorDrawerContext"
import { theme } from "~/theme"
import { ajv } from "~/utils/ajv"

import { ErrorProvider } from "../ErrorProvider"
import FormBuilder from "../FormBuilder"
import { resetCanvasBlockClipboard } from "../hooks/useCanvasPreviewClickToEdit"
import { resetCanvasShowGridPreference } from "../renderers/controls/JsonFormsCanvasPlacementControl"

// Some child block forms (e.g. blockquote's optional image) mount controls
// that read the page route; outside a Next app the router is not mounted
vi.mock("next/router", () => ({
  useRouter: () => ({ query: { siteId: "1", pageId: "1" } }),
}))

// The image upload dropzone needs a tRPC provider; uploads are not under test
vi.mock("~/components/PageEditor/FileAttachment", () => ({
  FileAttachment: () => null,
}))

const canvasSchema = getComponentSchema({ component: "canvas" })
const validateFn = ajv.compile<IsomerComponent>(canvasSchema)

const BLOCKQUOTE_BLOCK = {
  type: "blockquote",
  quote: "A quote inside the canvas",
  source: "A test source",
}

let container: HTMLDivElement
let root: Root | undefined

const renderCanvasForm = (
  data: unknown,
  handleChange: (data: IsomerComponent) => void = () => undefined,
) => {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)

  act(() => {
    root?.render(
      <ThemeProvider theme={theme}>
        <ErrorProvider>
          <FormBuilder<IsomerComponent>
            schema={canvasSchema}
            validateFn={validateFn}
            data={data}
            handleChange={handleChange}
          />
        </ErrorProvider>
      </ThemeProvider>,
    )
  })
}

// The preview-highlight behaviour reads the edited block's page position from
// the editor drawer context, so it needs the real provider around the form
const ActivateBlock = ({ index }: { index: number }) => {
  const { setCurrActiveIdx } = useEditorDrawerContext()
  useEffect(() => {
    setCurrActiveIdx(index)
  }, [index, setCurrActiveIdx])
  return null
}

const renderCanvasFormInEditorDrawer = (
  canvasBlock: IsomerComponent,
  handleChange: (data: IsomerComponent) => void = () => undefined,
) => {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)

  const pageState = {
    layout: "content",
    page: {
      title: "Canvas page",
      permalink: "/canvas-page",
      lastModified: new Date().toISOString(),
      contentPageHeader: { summary: "A canvas page" },
    },
    content: [canvasBlock],
    version: "0.1.0",
  } as IsomerSchema

  act(() => {
    root?.render(
      <ThemeProvider theme={theme}>
        <EditorDrawerProvider
          initialPageState={pageState}
          type="Page"
          permalink="/canvas-page"
          siteId={1}
          pageId={1}
          updatedAt={new Date()}
          title="Canvas page"
        >
          <ActivateBlock index={0} />
          <ErrorProvider>
            <FormBuilder<IsomerComponent>
              schema={canvasSchema}
              validateFn={validateFn}
              data={canvasBlock}
              handleChange={handleChange}
            />
          </ErrorProvider>
        </EditorDrawerProvider>
      </ThemeProvider>,
    )
  })
}

const findButtonByText = (text: string) =>
  Array.from(container.querySelectorAll("button")).find((button) =>
    button.textContent.includes(text),
  )

const click = (element: Element) => {
  act(() => {
    element.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    )
  })
}

const placementCellAt = (row: number, col: number) => {
  const cell = container.querySelector(
    `button[aria-label="Row ${row}, column ${col}"]`,
  )
  expect(cell).not.toBeNull()
  return cell!
}

// Press on one placement grid cell, sweep to another, then release
const dragBetweenPlacementCells = (
  from: { row: number; col: number },
  to: { row: number; col: number },
  init?: Pick<MouseEventInit, "shiftKey">,
) => {
  act(() => {
    placementCellAt(from.row, from.col).dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
    )
  })
  act(() => {
    // React synthesises mouseenter from bubbling mouseover events
    placementCellAt(to.row, to.col).dispatchEvent(
      new MouseEvent("mouseover", {
        bubbles: true,
        cancelable: true,
        relatedTarget: document.body,
        ...init,
      }),
    )
  })
  act(() => {
    window.dispatchEvent(new MouseEvent("mouseup"))
  })
}

const pressKey = (
  element: Element,
  key: string,
  init?: Pick<KeyboardEventInit, "shiftKey" | "metaKey" | "ctrlKey">,
) => {
  act(() => {
    element.dispatchEvent(
      new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
        ...init,
      }),
    )
  })
}

// @hello-pangea/dnd's keyboard sensor reads the legacy event.keyCode, which
// jsdom's KeyboardEvent constructor does not populate from `key`
const pressDndKey = (element: Element, keyCode: number) => {
  act(() => {
    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
    })
    Object.defineProperty(event, "keyCode", { value: keyCode })
    element.dispatchEvent(event)
  })
}

beforeAll(() => {
  ;(
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true

  // jsdom does not implement these browser APIs used by Chakra and downshift
  Object.assign(window, {
    matchMedia: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
    ResizeObserver: class {
      observe() {
        return undefined
      }
      unobserve() {
        return undefined
      }
      disconnect() {
        return undefined
      }
    },
    IntersectionObserver: class {
      root = null
      rootMargin = ""
      thresholds = []
      observe() {
        return undefined
      }
      unobserve() {
        return undefined
      }
      disconnect() {
        return undefined
      }
      takeRecords() {
        return []
      }
    },
  })
  Element.prototype.scrollIntoView = () => undefined
})

afterEach(() => {
  const currentRoot = root
  if (currentRoot) {
    act(() => {
      currentRoot.unmount()
    })
    root = undefined
  }
  container.remove()
})

describe("FormBuilder canvas editing interactions", () => {
  it("adds a new block to the list when Add item is clicked", () => {
    renderCanvasForm({ type: "canvas", blocks: [] })

    expect(container.textContent).toContain("Items you add will appear here")
    expect(container.textContent).not.toContain("Item 1")

    const addItemButton = findButtonByText("Add item")
    expect(addItemButton).toBeDefined()
    click(addItemButton!)

    expect(container.textContent).toContain("Item 1")
    expect(container.textContent).not.toContain(
      "Items you add will appear here",
    )
  })

  it("opens the nested item editor with the variant matching the block data", () => {
    renderCanvasForm({ type: "canvas", blocks: [BLOCKQUOTE_BLOCK] })

    const itemRow = findButtonByText("Item 1")
    expect(itemRow).toBeDefined()
    click(itemRow!)

    // The nested drawer replaces the list with the item editor
    expect(container.textContent).toContain("Edit Canvas blocks")

    // The anyOf variant picker preselects the variant fitting the data, and
    // only that variant's child form is rendered
    expect(container.textContent).toContain("Variant")
    expect(container.textContent).toContain("Blockquote")
    expect(container.textContent).toContain("Quote")
    expect(container.textContent).toContain("A quote inside the canvas")
    expect(container.textContent).toContain("Source")
    expect(container.textContent).not.toContain("Video to embed")

    // Every child block exposes the visual grid placement picker so it can
    // be positioned and sized on the canvas grid
    expect(container.textContent).toContain("Placement on grid")
    expect(
      container.querySelector('button[aria-label="Row 1, column 1"]'),
    ).not.toBeNull()
    expect(container.textContent).toContain("Not placed")

    // Item navigation controls are present
    expect(findButtonByText("Previous")).toBeDefined()
    expect(findButtonByText("Next")).toBeDefined()
  })

  it("switches the child form when a different variant is selected", () => {
    renderCanvasForm({ type: "canvas", blocks: [BLOCKQUOTE_BLOCK] })

    click(findButtonByText("Item 1")!)

    const combobox = Array.from(container.querySelectorAll("input")).find(
      (input) => input.getAttribute("role") === "combobox",
    )
    expect(combobox).toBeDefined()

    // The menu list is virtualized and does not render items in jsdom, so
    // select the Video variant the way a user searching would: type to
    // filter, then pick the match via the keyboard
    const valueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set
    act(() => {
      combobox!.focus()
      valueSetter?.call(combobox, "Video")
      combobox!.dispatchEvent(new Event("input", { bubbles: true }))
    })
    pressKey(combobox!, "ArrowDown")
    pressKey(combobox!, "Enter")

    // The video child form replaces the blockquote one
    expect(container.textContent).toContain("Video to embed")
    expect(container.textContent).not.toContain("A quote inside the canvas")
  })

  it("preselects the variant for a child whose schema contains $refs", () => {
    renderCanvasForm({
      type: "canvas",
      blocks: [
        {
          type: "callout",
          content: {
            type: "prose",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Callout in canvas" }],
              },
            ],
          },
        },
      ],
    })

    click(findButtonByText("Item 1")!)

    expect(container.textContent).toContain("Edit Canvas blocks")

    // JsonForms cannot compute indexOfFittingSchema for $ref-bearing
    // subschemas; without the type-const fallback in the combinator control
    // this would show the first variant (Image) instead of the callout form
    expect(container.textContent).toContain("Callout")
    expect(container.textContent).toContain("Callout in canvas")
    expect(container.textContent).not.toContain("Alternate text")
  })

  it("places and sizes a block by dragging across the placement grid", async () => {
    const changes: IsomerComponent[] = []
    renderCanvasForm({ type: "canvas", blocks: [BLOCKQUOTE_BLOCK] }, (data) =>
      changes.push(data),
    )

    click(findButtonByText("Item 1")!)

    const cellAt = (row: number, col: number) => {
      const cell = container.querySelector(
        `button[aria-label="Row ${row}, column ${col}"]`,
      )
      expect(cell).not.toBeNull()
      return cell!
    }

    // Press on the top-left corner of the desired area, sweep to the
    // bottom-right corner, then release — like drawing a box in Wix
    act(() => {
      cellAt(2, 3).dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
      )
    })
    act(() => {
      // React synthesises mouseenter from bubbling mouseover events
      cellAt(4, 8).dispatchEvent(
        new MouseEvent("mouseover", {
          bubbles: true,
          cancelable: true,
          relatedTarget: document.body,
        }),
      )
    })
    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"))
    })

    // The swept rectangle is highlighted and summarised
    expect(cellAt(2, 3).getAttribute("aria-pressed")).toBe("true")
    expect(cellAt(4, 8).getAttribute("aria-pressed")).toBe("true")
    expect(cellAt(1, 1).getAttribute("aria-pressed")).toBe("false")
    expect(container.textContent).toContain("Columns 3–8, rows 2–4")

    // The placement propagates through JsonForms validation to handleChange
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const lastChange = changes.at(-1) as
      | { blocks?: { placement?: unknown }[] }
      | undefined
    expect(lastChange?.blocks?.[0]?.placement).toEqual({
      colStart: 3,
      colSpan: 6,
      rowStart: 2,
      rowSpan: 3,
    })
  })

  it("shows a saved placement and removes it via Clear placement", async () => {
    const changes: IsomerComponent[] = []
    renderCanvasForm(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 1, colSpan: 6, rowStart: 1, rowSpan: 2 },
          },
        ],
      },
      (data) => changes.push(data),
    )

    click(findButtonByText("Item 1")!)

    // The saved placement is highlighted on the grid
    const savedCell = container.querySelector(
      'button[aria-label="Row 1, column 1"]',
    )
    expect(savedCell?.getAttribute("aria-pressed")).toBe("true")
    expect(container.textContent).toContain("Columns 1–6, rows 1–2")

    click(findButtonByText("Clear placement")!)

    // The block returns to unplaced full-width stacking
    expect(container.textContent).toContain("Not placed")
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const lastChange = changes.at(-1) as
      | { blocks?: { placement?: unknown }[] }
      | undefined
    expect(lastChange?.blocks).toHaveLength(1)
    expect(lastChange?.blocks?.[0]?.placement).toBeUndefined()
  })

  it("moves a placed block by dragging inside its selection", async () => {
    const changes: IsomerComponent[] = []
    renderCanvasForm(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 3, colSpan: 4, rowStart: 2, rowSpan: 2 },
          },
        ],
      },
      (data) => changes.push(data),
    )

    click(findButtonByText("Item 1")!)

    // Cell (2, 4) is inside the selection but not one of its corners, so
    // the drag translates the whole rectangle by the delta (+2 rows, +1 col)
    dragBetweenPlacementCells({ row: 2, col: 4 }, { row: 4, col: 5 })

    expect(container.textContent).toContain("Columns 4–7, rows 4–5")
    expect(placementCellAt(4, 4).getAttribute("aria-pressed")).toBe("true")
    expect(placementCellAt(2, 3).getAttribute("aria-pressed")).toBe("false")

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const lastChange = changes.at(-1) as
      | { blocks?: { placement?: unknown }[] }
      | undefined
    expect(lastChange?.blocks?.[0]?.placement).toEqual({
      colStart: 4,
      colSpan: 4,
      rowStart: 4,
      rowSpan: 2,
    })
  })

  it("constrains a Shift-drag move on the placement grid to a straight line", async () => {
    const changes: IsomerComponent[] = []
    renderCanvasForm(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 3, colSpan: 4, rowStart: 2, rowSpan: 2 },
          },
        ],
      },
      (data) => changes.push(data),
    )

    click(findButtonByText("Item 1")!)

    // Grab a body cell (2, 4) and sweep to (4, 5) with Shift held: the sweep
    // is 2 rows down but only 1 column right, so the move is constrained to
    // the dominant (vertical) axis and the columns stay put
    dragBetweenPlacementCells(
      { row: 2, col: 4 },
      { row: 4, col: 5 },
      { shiftKey: true },
    )

    expect(container.textContent).toContain("Columns 3–6, rows 4–5")
    expect(placementCellAt(4, 3).getAttribute("aria-pressed")).toBe("true")
    expect(placementCellAt(4, 7).getAttribute("aria-pressed")).toBe("false")

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const lastChange = changes.at(-1) as
      | { blocks?: { placement?: unknown }[] }
      | undefined
    expect(lastChange?.blocks?.[0]?.placement).toEqual({
      colStart: 3,
      colSpan: 4,
      rowStart: 4,
      rowSpan: 2,
    })
  })

  it("resizes a placed block by dragging one of its corners", async () => {
    const changes: IsomerComponent[] = []
    renderCanvasForm(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 3, colSpan: 4, rowStart: 2, rowSpan: 2 },
          },
        ],
      },
      (data) => changes.push(data),
    )

    click(findButtonByText("Item 1")!)

    // Cell (3, 6) is the bottom-right corner, so the drag resizes the
    // rectangle while its top-left corner (2, 3) stays anchored
    dragBetweenPlacementCells({ row: 3, col: 6 }, { row: 5, col: 9 })

    expect(container.textContent).toContain("Columns 3–9, rows 2–5")
    expect(placementCellAt(2, 3).getAttribute("aria-pressed")).toBe("true")
    expect(placementCellAt(5, 9).getAttribute("aria-pressed")).toBe("true")

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const lastChange = changes.at(-1) as
      | { blocks?: { placement?: unknown }[] }
      | undefined
    expect(lastChange?.blocks?.[0]?.placement).toEqual({
      colStart: 3,
      colSpan: 7,
      rowStart: 2,
      rowSpan: 4,
    })
  })

  it("keeps the block's proportions when Shift is held while dragging a corner", async () => {
    const changes: IsomerComponent[] = []
    renderCanvasForm(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 3, colSpan: 4, rowStart: 2, rowSpan: 2 },
          },
        ],
      },
      (data) => changes.push(data),
    )

    click(findButtonByText("Item 1")!)

    // Grab the bottom-right corner (3, 6) and sweep to (4, 10) with Shift
    // held: the pointer covers 8 columns but only 3 rows from the top-left
    // anchor (2, 3), so the columns lead and the rows are derived from the
    // block's 4:2 span ratio — 8 columns keep 4 rows, not the pointer's 3
    dragBetweenPlacementCells(
      { row: 3, col: 6 },
      { row: 4, col: 10 },
      { shiftKey: true },
    )

    expect(container.textContent).toContain("Columns 3–10, rows 2–5")
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const grownBlocks = (
      changes.at(-1) as { blocks?: { placement?: unknown }[] } | undefined
    )?.blocks
    expect(grownBlocks?.[0]?.placement).toEqual({
      colStart: 3,
      colSpan: 8,
      rowStart: 2,
      rowSpan: 4,
    })

    // A row-dominant Shift-sweep derives the columns instead; the block is
    // now 8×4, so 7 rows want 14 columns — clamped at the grid's last column
    dragBetweenPlacementCells(
      { row: 5, col: 10 },
      { row: 8, col: 4 },
      { shiftKey: true },
    )

    expect(container.textContent).toContain("Columns 3–12, rows 2–8")
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const clampedBlocks = (
      changes.at(-1) as { blocks?: { placement?: unknown }[] } | undefined
    )?.blocks
    expect(clampedBlocks?.[0]?.placement).toEqual({
      colStart: 3,
      colSpan: 10,
      rowStart: 2,
      rowSpan: 7,
    })

    // A fresh draw outside the saved placement has no proportions to keep:
    // Shift leaves the sweep following the pointer freely
    dragBetweenPlacementCells(
      { row: 7, col: 1 },
      { row: 8, col: 2 },
      { shiftKey: true },
    )

    expect(container.textContent).toContain("Columns 1–2, rows 7–8")
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const redrawnBlocks = (
      changes.at(-1) as { blocks?: { placement?: unknown }[] } | undefined
    )?.blocks
    expect(redrawnBlocks?.[0]?.placement).toEqual({
      colStart: 1,
      colSpan: 2,
      rowStart: 7,
      rowSpan: 2,
    })
  })

  it("clamps a moved block to the grid edge", async () => {
    const changes: IsomerComponent[] = []
    renderCanvasForm(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 4, rowStart: 2, rowSpan: 2 },
          },
        ],
      },
      (data) => changes.push(data),
    )

    click(findButtonByText("Item 1")!)

    // Dragging the body two columns left would push the block past column 1;
    // the move clamps at the grid edge and keeps the block's size
    dragBetweenPlacementCells({ row: 2, col: 3 }, { row: 2, col: 1 })

    expect(container.textContent).toContain("Columns 1–4, rows 2–3")

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const lastChange = changes.at(-1) as
      | { blocks?: { placement?: unknown }[] }
      | undefined
    expect(lastChange?.blocks?.[0]?.placement).toEqual({
      colStart: 1,
      colSpan: 4,
      rowStart: 2,
      rowSpan: 2,
    })
  })

  it("does not commit a placement identical to the saved one", async () => {
    const changes: IsomerComponent[] = []
    renderCanvasForm(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 3, colSpan: 4, rowStart: 2, rowSpan: 2 },
          },
        ],
      },
      (data) => changes.push(data),
    )

    click(findButtonByText("Item 1")!)

    // Flush JsonForms' initial onChange emission before taking the baseline
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const baselineChangeCount = changes.length

    // A plain click on the selection's body (a zero-delta move)
    act(() => {
      placementCellAt(2, 4).dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
      )
    })
    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"))
    })

    // A plain click on the selection's corner (a zero-delta resize)
    act(() => {
      placementCellAt(3, 6).dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
      )
    })
    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"))
    })

    // A body drag that returns to its origin cell before release
    act(() => {
      placementCellAt(2, 4).dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
      )
    })
    act(() => {
      placementCellAt(3, 5).dispatchEvent(
        new MouseEvent("mouseover", {
          bubbles: true,
          cancelable: true,
          relatedTarget: document.body,
        }),
      )
    })
    act(() => {
      placementCellAt(2, 4).dispatchEvent(
        new MouseEvent("mouseover", {
          bubbles: true,
          cancelable: true,
          relatedTarget: document.body,
        }),
      )
    })
    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"))
    })

    // Keyboard: Enter to grab a body cell, Enter again on the same cell
    pressKey(placementCellAt(2, 4), "Enter")
    pressKey(placementCellAt(2, 4), "Enter")

    // None of these dirtied the page, and the saved placement is unchanged
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(changes.length).toBe(baselineChangeCount)
    expect(container.textContent).toContain("Columns 3–6, rows 2–3")

    // A genuine move afterwards still commits
    dragBetweenPlacementCells({ row: 2, col: 4 }, { row: 4, col: 5 })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(changes.length).toBeGreaterThan(baselineChangeCount)
    const lastChange = changes.at(-1) as
      | { blocks?: { placement?: unknown }[] }
      | undefined
    expect(lastChange?.blocks?.[0]?.placement).toEqual({
      colStart: 4,
      colSpan: 4,
      rowStart: 4,
      rowSpan: 2,
    })
  })

  it("places and sizes a block with the keyboard", async () => {
    const changes: IsomerComponent[] = []
    renderCanvasForm({ type: "canvas", blocks: [BLOCKQUOTE_BLOCK] }, (data) =>
      changes.push(data),
    )

    click(findButtonByText("Item 1")!)

    // Enter on a cell starts the selection, moving focus sweeps it out, and
    // Enter on the ending cell commits it — the keyboard equivalent of the
    // mouse drag
    pressKey(placementCellAt(2, 3), "Enter")
    expect(placementCellAt(2, 3).getAttribute("aria-pressed")).toBe("true")

    act(() => {
      ;(placementCellAt(4, 8) as HTMLElement).focus()
    })
    expect(container.textContent).toContain("Columns 3–8, rows 2–4")
    expect(placementCellAt(3, 5).getAttribute("aria-pressed")).toBe("true")

    pressKey(placementCellAt(4, 8), "Enter")

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const lastChange = changes.at(-1) as
      | { blocks?: { placement?: unknown }[] }
      | undefined
    expect(lastChange?.blocks?.[0]?.placement).toEqual({
      colStart: 3,
      colSpan: 6,
      rowStart: 2,
      rowSpan: 3,
    })
  })

  it("cancels an in-progress keyboard selection with Escape", async () => {
    const changes: IsomerComponent[] = []
    renderCanvasForm({ type: "canvas", blocks: [BLOCKQUOTE_BLOCK] }, (data) =>
      changes.push(data),
    )

    click(findButtonByText("Item 1")!)

    pressKey(placementCellAt(2, 3), "Enter")
    act(() => {
      ;(placementCellAt(4, 8) as HTMLElement).focus()
    })
    expect(container.textContent).toContain("Columns 3–8, rows 2–4")

    pressKey(placementCellAt(4, 8), "Escape")

    // The selection is discarded, nothing is committed, and Escape does not
    // bubble into the nested drawer's close handling
    expect(container.textContent).toContain("Not placed")
    expect(container.textContent).toContain("Edit Canvas blocks")
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const lastChange = changes.at(-1) as
      | { blocks?: { placement?: unknown }[] }
      | undefined
    expect(lastChange?.blocks?.[0]?.placement).toBeUndefined()
  })

  it("moves a placed block with the keyboard", async () => {
    const changes: IsomerComponent[] = []
    renderCanvasForm(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 3, colSpan: 4, rowStart: 2, rowSpan: 2 },
          },
        ],
      },
      (data) => changes.push(data),
    )

    click(findButtonByText("Item 1")!)

    // Enter on a body cell of the saved selection grabs the rectangle (same
    // semantics as a mouse body-drag), focus shifts it, Enter drops it
    pressKey(placementCellAt(2, 4), "Enter")
    act(() => {
      ;(placementCellAt(4, 5) as HTMLElement).focus()
    })
    expect(container.textContent).toContain("Columns 4–7, rows 4–5")

    pressKey(placementCellAt(4, 5), "Enter")

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const lastChange = changes.at(-1) as
      | { blocks?: { placement?: unknown }[] }
      | undefined
    expect(lastChange?.blocks?.[0]?.placement).toEqual({
      colStart: 4,
      colSpan: 4,
      rowStart: 4,
      rowSpan: 2,
    })
  })

  it("nudges a placed block with the arrow keys, clamping at the grid edges and ignoring keystrokes in form fields", async () => {
    const changes: IsomerComponent[] = []
    renderCanvasForm(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 1, colSpan: 4, rowStart: 1, rowSpan: 2 },
          },
        ],
      },
      (data) => changes.push(data),
    )

    click(findButtonByText("Item 1")!)

    // JsonForms emits an initial change on a later tick; flush it so the
    // clamp assertions below compare against a settled baseline
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    const placementOf = (change: IsomerComponent | undefined) =>
      (change as { blocks?: { placement?: unknown }[] } | undefined)
        ?.blocks?.[0]?.placement

    // An arrow key pressed with focus outside any field nudges the block one
    // cell: right then down moves the rectangle to columns 2–5, rows 2–3
    pressKey(document.body, "ArrowRight")
    expect(container.textContent).toContain("Columns 2–5, rows 1–2")
    pressKey(document.body, "ArrowDown")
    expect(container.textContent).toContain("Columns 2–5, rows 2–3")
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(placementOf(changes.at(-1))).toEqual({
      colStart: 2,
      colSpan: 4,
      rowStart: 2,
      rowSpan: 2,
    })

    // Nudging into the grid edge clamps: the block is already back at
    // column 1, so a further ArrowLeft commits nothing
    pressKey(document.body, "ArrowLeft")
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const settledCount = changes.length
    expect(placementOf(changes.at(-1))).toEqual({
      colStart: 1,
      colSpan: 4,
      rowStart: 2,
      rowSpan: 2,
    })
    pressKey(document.body, "ArrowLeft")
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(changes.length).toBe(settledCount)
    expect(container.textContent).toContain("Columns 1–4, rows 2–3")

    // Arrow keys pressed while typing in a form field keep their editing
    // meaning and never move the block
    const quoteInput = Array.from(
      container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input, textarea",
      ),
    ).find((field) => field.value === BLOCKQUOTE_BLOCK.quote)
    expect(quoteInput).not.toBeUndefined()
    pressKey(quoteInput!, "ArrowLeft")
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(changes.length).toBe(settledCount)
    expect(container.textContent).toContain("Columns 1–4, rows 2–3")
  })

  it("resizes a placed block with Shift+arrow keys, clamping at the grid edges and minimum size", async () => {
    const changes: IsomerComponent[] = []
    renderCanvasForm(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 9, colSpan: 3, rowStart: 1, rowSpan: 2 },
          },
        ],
      },
      (data) => changes.push(data),
    )

    click(findButtonByText("Item 1")!)

    // JsonForms emits an initial change on a later tick; flush it so the
    // clamp assertions below compare against a settled baseline
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    const placementOf = (change: IsomerComponent | undefined) =>
      (change as { blocks?: { placement?: unknown }[] } | undefined)
        ?.blocks?.[0]?.placement

    // Shift+arrow grows or shrinks the block's end edge one cell: right then
    // down grows the rectangle to columns 9–12, rows 1–3
    pressKey(document.body, "ArrowRight", { shiftKey: true })
    expect(container.textContent).toContain("Columns 9–12, rows 1–2")
    pressKey(document.body, "ArrowDown", { shiftKey: true })
    expect(container.textContent).toContain("Columns 9–12, rows 1–3")
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(placementOf(changes.at(-1))).toEqual({
      colStart: 9,
      colSpan: 4,
      rowStart: 1,
      rowSpan: 3,
    })

    // Growing past the last column clamps: the block already ends at column
    // 12, so a further Shift+ArrowRight commits nothing
    const grownCount = changes.length
    pressKey(document.body, "ArrowRight", { shiftKey: true })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(changes.length).toBe(grownCount)
    expect(container.textContent).toContain("Columns 9–12, rows 1–3")

    // Shrinking works down to a single cell
    pressKey(document.body, "ArrowUp", { shiftKey: true })
    pressKey(document.body, "ArrowUp", { shiftKey: true })
    expect(container.textContent).toContain("Columns 9–12, rows 1–1")
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(placementOf(changes.at(-1))).toEqual({
      colStart: 9,
      colSpan: 4,
      rowStart: 1,
      rowSpan: 1,
    })

    // A single-cell-tall block cannot shrink further, so a further
    // Shift+ArrowUp commits nothing
    const shrunkCount = changes.length
    pressKey(document.body, "ArrowUp", { shiftKey: true })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(changes.length).toBe(shrunkCount)
    expect(container.textContent).toContain("Columns 9–12, rows 1–1")

    // Shift+arrow while typing in a form field keeps its text-selection
    // meaning and never resizes the block
    const quoteInput = Array.from(
      container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input, textarea",
      ),
    ).find((field) => field.value === BLOCKQUOTE_BLOCK.quote)
    expect(quoteInput).not.toBeUndefined()
    pressKey(quoteInput!, "ArrowRight", { shiftKey: true })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(changes.length).toBe(shrunkCount)
    expect(container.textContent).toContain("Columns 9–12, rows 1–1")
  })

  it("shades cells occupied by sibling blocks on the placement grid", () => {
    renderCanvasForm({
      type: "canvas",
      blocks: [
        {
          ...BLOCKQUOTE_BLOCK,
          placement: { colStart: 1, colSpan: 4, rowStart: 1, rowSpan: 2 },
        },
        {
          type: "blockquote",
          quote: "The second quote",
          source: "Second",
          placement: { colStart: 7, colSpan: 3, rowStart: 2, rowSpan: 1 },
        },
      ],
    })

    click(findButtonByText("Item 2")!)

    // The sibling's area (columns 1-4, rows 1-2) is marked occupied, while
    // this block's own saved placement is highlighted as selected instead
    const occupiedCell = container.querySelector(
      'button[aria-label="Row 1, column 1 (occupied by another block)"]',
    )
    expect(occupiedCell).not.toBeNull()
    expect(occupiedCell?.getAttribute("aria-pressed")).toBe("false")

    const ownCell = container.querySelector(
      'button[aria-label="Row 2, column 7"]',
    )
    expect(ownCell?.getAttribute("aria-pressed")).toBe("true")

    // Cells outside both areas are plain
    expect(
      container.querySelector('button[aria-label="Row 5, column 12"]'),
    ).not.toBeNull()

    expect(container.textContent).toContain(
      "Shaded cells are occupied by other blocks in this canvas.",
    )
  })

  it("warns when a placement overlaps a sibling block but still commits it", async () => {
    const OVERLAP_WARNING = "This placement overlaps another block."
    const changes: IsomerComponent[] = []
    renderCanvasForm(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 1, colSpan: 4, rowStart: 1, rowSpan: 2 },
          },
          {
            type: "blockquote",
            quote: "The second quote",
            source: "Second",
            placement: { colStart: 7, colSpan: 3, rowStart: 2, rowSpan: 1 },
          },
        ],
      },
      (data) => changes.push(data),
    )

    click(findButtonByText("Item 2")!)

    // The saved placements (columns 7-9 vs columns 1-4) do not overlap
    expect(container.textContent).not.toContain(OVERLAP_WARNING)

    // Grab the block's body at (2, 8) and drop it next to the sibling: the
    // move lands on columns 4-6, row 1, sharing column 4 with the sibling
    dragBetweenPlacementCells({ row: 2, col: 8 }, { row: 1, col: 5 })

    expect(container.textContent).toContain(OVERLAP_WARNING)

    // Overlap is legal (blocks stack on the page), so the placement still
    // propagates through JsonForms validation to handleChange
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const lastChange = changes.at(-1) as
      | { blocks?: { placement?: unknown }[] }
      | undefined
    expect(lastChange?.blocks?.[1]?.placement).toEqual({
      colStart: 4,
      colSpan: 3,
      rowStart: 1,
      rowSpan: 1,
    })
  })

  it("removes the open block and returns to the list when Remove item is clicked", async () => {
    const changes: IsomerComponent[] = []
    renderCanvasForm(
      {
        type: "canvas",
        blocks: [
          BLOCKQUOTE_BLOCK,
          { type: "blockquote", quote: "The second quote", source: "Second" },
        ],
      },
      (data) => changes.push(data),
    )

    click(findButtonByText("Item 1")!)
    expect(container.textContent).toContain("Edit Canvas blocks")

    const removeButton = container.querySelector(
      'button[aria-label="Remove item"]',
    )
    expect(removeButton).toBeDefined()
    click(removeButton!)

    // The drawer closes back to the list, which now holds only the second
    // block (shifted up into the Item 1 slot)
    expect(container.textContent).not.toContain("Edit Canvas blocks")
    expect(container.textContent).toContain("Item 1")
    expect(container.textContent).not.toContain("Item 2")

    // The removal propagates through JsonForms validation to handleChange
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const lastChange = changes.at(-1) as
      | { blocks?: { quote?: string }[] }
      | undefined
    expect(lastChange?.blocks).toHaveLength(1)
    expect(lastChange?.blocks?.[0]?.quote).toBe("The second quote")
  })

  it("shows the empty state after removing the only block", async () => {
    const changes: IsomerComponent[] = []
    renderCanvasForm({ type: "canvas", blocks: [BLOCKQUOTE_BLOCK] }, (data) =>
      changes.push(data),
    )

    click(findButtonByText("Item 1")!)
    click(container.querySelector('button[aria-label="Remove item"]')!)

    expect(container.textContent).toContain("Items you add will appear here")
    expect(container.textContent).not.toContain("Item 1")

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const lastChange = changes.at(-1) as { blocks?: unknown[] } | undefined
    expect(lastChange?.blocks).toHaveLength(0)
  })

  it("removes the selected block with the Delete and Backspace keys, ignoring keystrokes in form fields", async () => {
    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          BLOCKQUOTE_BLOCK,
          { type: "blockquote", quote: "The second quote", source: "Second" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )

    // Delete in the list view (no block selected) removes nothing
    pressKey(document.body, "Delete")
    expect(container.textContent).toContain("Item 1")
    expect(container.textContent).toContain("Item 2")

    click(findButtonByText("Item 1")!)
    expect(container.textContent).toContain("Edit Canvas blocks")

    // JsonForms emits an initial change on a later tick; flush it so the
    // assertions below compare against a settled baseline
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    // Delete pressed while typing in a form field keeps its editing meaning
    // and never removes the block
    const quoteInput = Array.from(
      container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input, textarea",
      ),
    ).find((field) => field.value === BLOCKQUOTE_BLOCK.quote)
    expect(quoteInput).not.toBeUndefined()
    pressKey(quoteInput!, "Delete")
    expect(container.textContent).toContain("Edit Canvas blocks")

    // Delete with focus outside any field removes the block and returns to
    // the list, which now holds only the second block
    pressKey(document.body, "Delete")
    expect(container.textContent).not.toContain("Edit Canvas blocks")
    expect(container.textContent).toContain("Item 1")
    expect(container.textContent).not.toContain("Item 2")
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const afterDelete = changes.at(-1) as
      | { blocks?: { quote?: string }[] }
      | undefined
    expect(afterDelete?.blocks).toHaveLength(1)
    expect(afterDelete?.blocks?.[0]?.quote).toBe("The second quote")

    // Backspace (the Mac delete key) removes the remaining block the same way
    click(findButtonByText("Item 1")!)
    pressKey(document.body, "Backspace")
    expect(container.textContent).toContain("Items you add will appear here")
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const afterBackspace = changes.at(-1) as { blocks?: unknown[] } | undefined
    expect(afterBackspace?.blocks).toHaveLength(0)
  })

  it("duplicates the selected block with ⌘D/Ctrl+D, offsetting its placement one row down", async () => {
    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 4, rowStart: 1, rowSpan: 2 },
          },
          { type: "blockquote", quote: "The second quote", source: "Second" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )

    // ⌘D in the list view (no block selected) duplicates nothing
    pressKey(document.body, "d", { metaKey: true })
    expect(container.textContent).toContain("Item 2")
    expect(container.textContent).not.toContain("Item 3")

    click(findButtonByText("Item 1")!)
    expect(container.textContent).toContain("Edit Canvas blocks")
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    // ⌘D while typing in a form field, or a plain "d", never duplicates
    const quoteInput = Array.from(
      container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input, textarea",
      ),
    ).find((field) => field.value === BLOCKQUOTE_BLOCK.quote)
    expect(quoteInput).not.toBeUndefined()
    pressKey(quoteInput!, "d", { metaKey: true })
    pressKey(document.body, "d")
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const beforeDuplicate = changes.at(-1) as { blocks?: unknown[] } | undefined
    expect(beforeDuplicate?.blocks ?? []).toHaveLength(2)

    // ⌘D with focus outside any field appends a copy of the block with its
    // placement shifted one row down, and the editor switches to the copy
    pressKey(document.body, "d", { metaKey: true })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const afterDuplicate = changes.at(-1) as
      | {
          blocks?: {
            quote?: string
            placement?: { rowStart?: number; colStart?: number }
          }[]
        }
      | undefined
    expect(afterDuplicate?.blocks).toHaveLength(3)
    expect(afterDuplicate?.blocks?.[2]?.quote).toBe(BLOCKQUOTE_BLOCK.quote)
    expect(afterDuplicate?.blocks?.[2]?.placement).toEqual({
      colStart: 2,
      colSpan: 4,
      rowStart: 2,
      rowSpan: 2,
    })
    // The copy's shifted placement shows in the picker summary, proving the
    // nested editor now edits the duplicate
    expect(container.textContent).toContain("Columns 2–5, rows 2–3")

    // Ctrl+D duplicates the copy the same way, shifting one more row down
    pressKey(document.body, "d", { ctrlKey: true })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const afterCtrlDuplicate = changes.at(-1) as
      | { blocks?: { placement?: { rowStart?: number } }[] }
      | undefined
    expect(afterCtrlDuplicate?.blocks).toHaveLength(4)
    expect(afterCtrlDuplicate?.blocks?.[3]?.placement?.rowStart).toBe(3)
  })

  it("copies, cuts, and pastes canvas blocks with ⌘C/⌘X/⌘V", async () => {
    resetCanvasBlockClipboard()
    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 4, rowStart: 1, rowSpan: 2 },
          },
          { type: "blockquote", quote: "The second quote", source: "Second" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }
    const lastBlocks = () =>
      (
        changes.at(-1) as
          | {
              blocks?: {
                quote?: string
                placement?: { rowStart?: number }
              }[]
            }
          | undefined
      )?.blocks

    // ⌘V with an empty block clipboard pastes nothing
    pressKey(document.body, "v", { metaKey: true })
    await flush()
    expect(container.textContent).toContain("Item 2")
    expect(container.textContent).not.toContain("Item 3")

    click(findButtonByText("Item 1")!)
    expect(container.textContent).toContain("Edit Canvas blocks")
    await flush()

    // ⌘C while typing in a form field keeps its native copy meaning, so a
    // following ⌘V still has nothing to paste
    const quoteInput = Array.from(
      container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input, textarea",
      ),
    ).find((field) => field.value === BLOCKQUOTE_BLOCK.quote)
    expect(quoteInput).not.toBeUndefined()
    pressKey(quoteInput!, "c", { metaKey: true })
    pressKey(document.body, "v", { metaKey: true })
    await flush()
    expect(lastBlocks() ?? []).toHaveLength(2)

    // ⌘C then ⌘V appends a copy of the block with its placement shifted one
    // row down, and the editor switches to the pasted copy
    pressKey(document.body, "c", { metaKey: true })
    pressKey(document.body, "v", { metaKey: true })
    await flush()
    expect(lastBlocks()).toHaveLength(3)
    expect(lastBlocks()?.[2]?.quote).toBe(BLOCKQUOTE_BLOCK.quote)
    expect(lastBlocks()?.[2]?.placement).toEqual({
      colStart: 2,
      colSpan: 4,
      rowStart: 2,
      rowSpan: 2,
    })
    expect(container.textContent).toContain("Columns 2–5, rows 2–3")

    // Pasting again cascades one more row down instead of stacking
    pressKey(document.body, "v", { ctrlKey: true })
    await flush()
    expect(lastBlocks()).toHaveLength(4)
    expect(lastBlocks()?.[3]?.placement?.rowStart).toBe(3)

    // Paste needs no selection: after Escape back to the list, ⌘V still
    // appends (and selects) the next cascaded copy
    pressKey(document.body, "Escape")
    await flush()
    expect(container.textContent).toContain("Item 4")
    pressKey(document.body, "v", { metaKey: true })
    await flush()
    expect(lastBlocks()).toHaveLength(5)
    expect(container.textContent).toContain("Columns 2–5, rows 4–5")

    // ⌘C over a live text selection defers to the native copy: the block
    // clipboard still holds the first block, not the newly selected one
    pressKey(document.body, "Escape")
    await flush()
    click(findButtonByText("Item 2")!)
    await flush()
    const selection = document.getSelection()!
    const range = document.createRange()
    range.selectNodeContents(container)
    selection.removeAllRanges()
    selection.addRange(range)
    pressKey(document.body, "c", { metaKey: true })
    selection.removeAllRanges()
    pressKey(document.body, "v", { metaKey: true })
    await flush()
    expect(lastBlocks()).toHaveLength(6)
    expect(lastBlocks()?.[5]?.quote).toBe(BLOCKQUOTE_BLOCK.quote)

    // ⌘X cuts: the block leaves the canvas and the editor returns to the
    // list, and ⌘V puts it back
    pressKey(document.body, "Escape")
    await flush()
    click(findButtonByText("Item 2")!)
    await flush()
    pressKey(document.body, "x", { metaKey: true })
    await flush()
    expect(lastBlocks()).toHaveLength(5)
    expect(
      lastBlocks()?.some((block) => block.quote === "The second quote"),
    ).toBe(false)
    expect(container.textContent).toContain("Add item")
    pressKey(document.body, "v", { metaKey: true })
    await flush()
    expect(lastBlocks()).toHaveLength(6)
    expect(lastBlocks()?.[5]?.quote).toBe("The second quote")
    expect(lastBlocks()?.[5]?.placement).toBeUndefined()
  })

  it("arranges the selected block forward and backward in stacking order with ⌘]/⌘[", async () => {
    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 4, rowStart: 1, rowSpan: 2 },
          },
          { type: "blockquote", quote: "The second quote", source: "Second" },
          { type: "blockquote", quote: "The third quote", source: "Third" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const lastQuotes = () =>
      (
        changes.at(-1) as { blocks?: { quote?: string }[] } | undefined
      )?.blocks?.map((block) => block.quote)
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }

    // ⌘] in the list view (no block selected) reorders nothing
    pressKey(document.body, "]", { metaKey: true })
    await flush()
    expect(lastQuotes()).toEqual([
      BLOCKQUOTE_BLOCK.quote,
      "The second quote",
      "The third quote",
    ])

    click(findButtonByText("Item 1")!)
    expect(container.textContent).toContain("Edit Canvas blocks")
    await flush()

    // ⌘[ with the block already at the back of the stack, and ⌘] while
    // typing in a form field, reorder nothing
    pressKey(document.body, "[", { metaKey: true })
    const quoteInput = Array.from(
      container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input, textarea",
      ),
    ).find((field) => field.value === BLOCKQUOTE_BLOCK.quote)
    expect(quoteInput).not.toBeUndefined()
    pressKey(quoteInput!, "]", { metaKey: true })
    await flush()
    expect(lastQuotes()).toEqual([
      BLOCKQUOTE_BLOCK.quote,
      "The second quote",
      "The third quote",
    ])

    // ⌘] brings the block forward one step and the editor follows it: the
    // picker summary still shows the moved block's placement
    pressKey(document.body, "]", { metaKey: true })
    await flush()
    expect(lastQuotes()).toEqual([
      "The second quote",
      BLOCKQUOTE_BLOCK.quote,
      "The third quote",
    ])
    expect(container.textContent).toContain("Columns 2–5, rows 1–2")

    // Ctrl+] brings it forward again, to the front of the stack
    pressKey(document.body, "]", { ctrlKey: true })
    await flush()
    expect(lastQuotes()).toEqual([
      "The second quote",
      "The third quote",
      BLOCKQUOTE_BLOCK.quote,
    ])

    // ⌘] with the block already at the front clamps to a no-op
    pressKey(document.body, "]", { metaKey: true })
    await flush()
    expect(lastQuotes()).toEqual([
      "The second quote",
      "The third quote",
      BLOCKQUOTE_BLOCK.quote,
    ])

    // ⌘[ sends the block backward one step, the editor still following it
    pressKey(document.body, "[", { ctrlKey: true })
    await flush()
    expect(lastQuotes()).toEqual([
      "The second quote",
      BLOCKQUOTE_BLOCK.quote,
      "The third quote",
    ])
    expect(container.textContent).toContain("Columns 2–5, rows 1–2")
  })

  it("moves the selected block to the front and back of the stack with ⌘⇧]/⌘⇧[", async () => {
    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 4, rowStart: 1, rowSpan: 2 },
          },
          { type: "blockquote", quote: "The second quote", source: "Second" },
          { type: "blockquote", quote: "The third quote", source: "Third" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const lastQuotes = () =>
      (
        changes.at(-1) as { blocks?: { quote?: string }[] } | undefined
      )?.blocks?.map((block) => block.quote)
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }

    click(findButtonByText("Item 1")!)
    expect(container.textContent).toContain("Edit Canvas blocks")
    await flush()

    // ⌘⇧] while typing in a form field keeps its editing meaning
    const quoteInput = Array.from(
      container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input, textarea",
      ),
    ).find((field) => field.value === BLOCKQUOTE_BLOCK.quote)
    expect(quoteInput).not.toBeUndefined()
    pressKey(quoteInput!, "}", { metaKey: true, shiftKey: true })
    await flush()
    expect(lastQuotes()).toEqual([
      BLOCKQUOTE_BLOCK.quote,
      "The second quote",
      "The third quote",
    ])

    // ⌘⇧] (Shift+] arrives as "}" on US layouts) jumps the block from the
    // back of the stack straight to the front, the editor following it: the
    // picker summary still shows the moved block's placement
    pressKey(document.body, "}", { metaKey: true, shiftKey: true })
    await flush()
    expect(lastQuotes()).toEqual([
      "The second quote",
      "The third quote",
      BLOCKQUOTE_BLOCK.quote,
    ])
    expect(container.textContent).toContain("Columns 2–5, rows 1–2")

    // ⌘⇧] with the block already at the front clamps to a no-op
    pressKey(document.body, "}", { metaKey: true, shiftKey: true })
    await flush()
    expect(lastQuotes()).toEqual([
      "The second quote",
      "The third quote",
      BLOCKQUOTE_BLOCK.quote,
    ])

    // Ctrl+Shift+[ (layouts that report the unshifted key) sends the block
    // all the way to the back in one step, the editor still following it
    pressKey(document.body, "[", { ctrlKey: true, shiftKey: true })
    await flush()
    expect(lastQuotes()).toEqual([
      BLOCKQUOTE_BLOCK.quote,
      "The second quote",
      "The third quote",
    ])
    expect(container.textContent).toContain("Columns 2–5, rows 1–2")

    // ⌘⇧[ with the block already at the back clamps to a no-op
    pressKey(document.body, "{", { metaKey: true, shiftKey: true })
    await flush()
    expect(lastQuotes()).toEqual([
      BLOCKQUOTE_BLOCK.quote,
      "The second quote",
      "The third quote",
    ])
  })

  it("deselects the open block back to the list with Escape, unless a drag is active or focus is in a form field", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
      KeyboardEvent: typeof KeyboardEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    const previewBlock = previewDocument.querySelector<HTMLElement>(
      '[data-canvas-block-index="0"]',
    )!
    previewBlock.style.setProperty("--canvas-grid-column", "2 / span 4")
    previewBlock.style.setProperty("--canvas-grid-row", "1 / span 2")

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 4, rowStart: 1, rowSpan: 2 },
          },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )

    // Escape in the list view (no block selected) is a no-op
    pressKey(document.body, "Escape")
    expect(container.textContent).toContain("Item 1")

    click(findButtonByText("Item 1")!)
    expect(container.textContent).toContain("Edit Canvas blocks")
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    // Escape while typing in a form field keeps its editing meaning (e.g.
    // closing a dropdown) and never deselects the block
    const quoteInput = Array.from(
      container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input, textarea",
      ),
    ).find((field) => field.value === BLOCKQUOTE_BLOCK.quote)
    expect(quoteInput).not.toBeUndefined()
    pressKey(quoteInput!, "Escape")
    expect(container.textContent).toContain("Edit Canvas blocks")

    // Escape while a placement drag is in progress cancels the drag but
    // keeps the block's editor open
    act(() => {
      previewBlock.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: 85,
          clientY: 16,
        }),
      )
    })
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.MouseEvent("mousemove", { clientX: 165, clientY: 48 }),
      )
    })
    expect(
      previewDocument.querySelector("[data-canvas-grid-overlay]"),
    ).not.toBeNull()
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        }),
      )
    })
    expect(
      previewDocument.querySelector("[data-canvas-grid-overlay]"),
    ).toBeNull()
    expect(container.textContent).toContain("Edit Canvas blocks")
    expect(container.textContent).toContain("Columns 2–5, rows 1–2")
    act(() => {
      iframe.contentWindow!.dispatchEvent(new iframeRealm.MouseEvent("mouseup"))
    })

    // With no drag active any more, Escape returns to the block list
    // without committing any data change
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const baselineChangeCount = changes.length
    pressKey(document.body, "Escape")
    expect(container.textContent).not.toContain("Edit Canvas blocks")
    expect(container.textContent).toContain("Item 1")
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(changes.length).toBe(baselineChangeCount)

    // Escape also deselects when focus sits in the preview iframe
    click(findButtonByText("Item 1")!)
    expect(container.textContent).toContain("Edit Canvas blocks")
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        }),
      )
    })
    expect(container.textContent).not.toContain("Edit Canvas blocks")
    expect(container.textContent).toContain("Item 1")

    iframe.remove()
  })

  it("reorders blocks via a keyboard drag and propagates the new order", async () => {
    const changes: IsomerComponent[] = []
    renderCanvasForm(
      {
        type: "canvas",
        blocks: [
          BLOCKQUOTE_BLOCK,
          { type: "blockquote", quote: "The second quote", source: "Second" },
        ],
      },
      (data) => changes.push(data),
    )

    const dragHandles = container.querySelectorAll(
      "[data-rfd-drag-handle-draggable-id]",
    )
    expect(dragHandles).toHaveLength(2)
    const firstHandle = dragHandles[0]!

    // Space lifts the first block, ArrowDown moves it below the second,
    // Space drops it (keyCodes 32/40 per the dnd keyboard sensor)
    pressDndKey(firstHandle, 32)
    pressDndKey(firstHandle, 40)
    pressDndKey(firstHandle, 32)

    // onDragEnd walks the move through JsonForms' moveDown into a data
    // update, which reaches handleChange from an effect on a later tick
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const lastChange = changes.at(-1) as
      | { blocks?: { quote?: string }[] }
      | undefined
    expect(lastChange?.blocks).toHaveLength(2)
    expect(lastChange?.blocks?.[0]?.quote).toBe("The second quote")
    expect(lastChange?.blocks?.[1]?.quote).toBe("A quote inside the canvas")
  })

  it("shows the saved width and height when editing an existing canvas", async () => {
    const changes: IsomerComponent[] = []
    renderCanvasForm(
      { type: "canvas", blocks: [], width: 50, height: 400 },
      (data) => changes.push(data),
    )

    const inputByLabel = (labelText: string) => {
      const label = Array.from(container.querySelectorAll("label")).find(
        (candidate) => candidate.textContent.includes(labelText),
      )
      return label?.closest(".chakra-form-control")?.querySelector("input")
    }

    // The integer control must render the stored data, not the schema
    // minimum, or every reopened canvas would appear to have width 10
    const widthInput = inputByLabel("Width (%)")
    const heightInput = inputByLabel("Height (px)")
    expect(widthInput?.value).toBe("50")
    expect(heightInput?.value).toBe("400")

    // Edits increment from the saved value rather than the minimum
    act(() => {
      widthInput?.focus()
    })
    pressKey(widthInput!, "ArrowUp")
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(widthInput!.value).toBe("51")
    const lastChange = changes.at(-1) as { width?: number } | undefined
    expect(lastChange?.width).toBe(51)
  })

  it("propagates width edits to handleChange as valid canvas data", async () => {
    const changes: IsomerComponent[] = []
    renderCanvasForm({ type: "canvas", blocks: [] }, (data) =>
      changes.push(data),
    )

    const widthLabel = Array.from(container.querySelectorAll("label")).find(
      (label) => label.textContent.includes("Width (%)"),
    )
    expect(widthLabel).toBeDefined()
    const widthInput = widthLabel!
      .closest(".chakra-form-control")
      ?.querySelector("input")
    expect(widthInput).toBeInstanceOf(window.HTMLInputElement)

    // The width field starts at its schema minimum (10); ArrowUp increments
    // it through Chakra's number input keyboard handling
    act(() => {
      widthInput?.focus()
    })
    pressKey(widthInput!, "ArrowUp")

    // JsonForms emits onChange from an effect on the next tick, so give it a
    // moment to flush before inspecting the captured changes
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(widthInput!.value).toBe("11")
    const lastChange = changes.at(-1) as { width?: number } | undefined
    expect(lastChange?.width).toBe(11)
  })

  it("highlights the edited block in the live preview while its placement editor is open", () => {
    // Stand-in for the preview pane: an iframe whose document contains the
    // markup the Canvas renderer emits for a two-block canvas
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"></div>
        <div data-canvas-block-index="1"></div>
      </div>
    `
    // The iframe realm has its own Element prototype, which jsdom leaves
    // without scrollIntoView
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    renderCanvasFormInEditorDrawer({
      type: "canvas",
      blocks: [
        BLOCKQUOTE_BLOCK,
        { type: "blockquote", quote: "Second quote", source: "s" },
      ],
    } as IsomerComponent)

    const firstBlock = previewDocument.querySelector<HTMLElement>(
      '[data-canvas-block-index="0"]',
    )
    const secondBlock = previewDocument.querySelector<HTMLElement>(
      '[data-canvas-block-index="1"]',
    )
    expect(firstBlock).not.toBeNull()
    expect(secondBlock).not.toBeNull()

    // Nothing is highlighted until a block's editor is open
    expect(firstBlock!.style.outline).toBe("")
    expect(secondBlock!.style.outline).toBe("")

    click(findButtonByText("Item 2")!)

    // The edited block (and only that block) is outlined in the preview
    expect(secondBlock!.style.outline).toContain("2px solid")
    expect(secondBlock!.style.outlineOffset).toBe("2px")
    expect(firstBlock!.style.outline).toBe("")

    // Closing the editor removes the highlight
    const currentRoot = root!
    act(() => {
      currentRoot.unmount()
    })
    root = undefined
    expect(secondBlock!.style.outline).toBe("")
    expect(secondBlock!.style.outlineOffset).toBe("")

    iframe.remove()
  })

  it("moves the block in the live preview while dragging and restores it on cancel", () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    const previewBlock = previewDocument.querySelector<HTMLElement>(
      '[data-canvas-block-index="0"]',
    )!
    // The Canvas renderer emits this for an unplaced block
    previewBlock.style.setProperty("--canvas-grid-column", "1 / -1")

    renderCanvasFormInEditorDrawer({
      type: "canvas",
      blocks: [BLOCKQUOTE_BLOCK],
    } as IsomerComponent)

    click(findButtonByText("Item 1")!)

    // Sweep a rectangle without releasing: the preview block follows live
    act(() => {
      placementCellAt(2, 3).dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
      )
    })
    act(() => {
      placementCellAt(4, 8).dispatchEvent(
        new MouseEvent("mouseover", {
          bubbles: true,
          cancelable: true,
          relatedTarget: document.body,
        }),
      )
    })
    expect(previewBlock.style.getPropertyValue("--canvas-grid-column")).toBe(
      "3 / span 6",
    )
    expect(previewBlock.style.getPropertyValue("--canvas-grid-row")).toBe(
      "2 / span 3",
    )

    // Escape cancels the drag and puts the preview block back where it was
    pressKey(placementCellAt(4, 8), "Escape")
    expect(previewBlock.style.getPropertyValue("--canvas-grid-column")).toBe(
      "1 / -1",
    )
    expect(previewBlock.style.getPropertyValue("--canvas-grid-row")).toBe("")

    // A completed drag leaves the preview block at the committed placement
    dragBetweenPlacementCells({ row: 1, col: 2 }, { row: 2, col: 5 })
    expect(previewBlock.style.getPropertyValue("--canvas-grid-column")).toBe(
      "2 / span 4",
    )
    expect(previewBlock.style.getPropertyValue("--canvas-grid-row")).toBe(
      "1 / span 2",
    )

    iframe.remove()
  })

  it("shows grid guides on the preview canvas while a placement drag is active", () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    // Measurable geometry so the guides have a content box to cover
    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    renderCanvasFormInEditorDrawer({
      type: "canvas",
      blocks: [BLOCKQUOTE_BLOCK],
    } as IsomerComponent)

    click(findButtonByText("Item 1")!)

    const overlay = () =>
      previewDocument.querySelector("[data-canvas-grid-overlay]")

    // No guides until a drag starts
    expect(overlay()).toBeNull()

    act(() => {
      placementCellAt(2, 3).dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
      )
    })
    // 12 column guides plus the row guides
    expect(overlay()).not.toBeNull()
    expect(overlay()!.children.length).toBeGreaterThan(12)

    act(() => {
      placementCellAt(4, 8).dispatchEvent(
        new MouseEvent("mouseover", {
          bubbles: true,
          cancelable: true,
          relatedTarget: document.body,
        }),
      )
    })
    expect(overlay()).not.toBeNull()

    // Cancelling the drag removes the guides
    pressKey(placementCellAt(4, 8), "Escape")
    expect(overlay()).toBeNull()

    // Committing a drag removes them too
    act(() => {
      placementCellAt(1, 2).dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
      )
    })
    expect(overlay()).not.toBeNull()
    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"))
    })
    expect(overlay()).toBeNull()

    iframe.remove()
  })

  it("shows solid alignment guides when a dragged selection lines up with a sibling block", () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"></div>
        <div data-canvas-block-index="1"></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    // Measurable geometry (480×320: 40px columns, 32px base rows) so the
    // guides have positions to assert against
    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    // The sibling occupies columns 3–6, rows 2–3: its edges sit on column
    // lines 3 and 7 and row lines 2 and 4
    renderCanvasFormInEditorDrawer({
      type: "canvas",
      blocks: [
        BLOCKQUOTE_BLOCK,
        {
          type: "blockquote",
          quote: "Second quote",
          source: "s",
          placement: { colStart: 3, colSpan: 4, rowStart: 2, rowSpan: 2 },
        },
      ],
    } as IsomerComponent)

    click(findButtonByText("Item 1")!)

    const guides = () =>
      previewDocument.querySelector("[data-canvas-alignment-guides]")
    const guideLines = () => {
      const lines = Array.from(guides()?.children ?? []) as HTMLElement[]
      return {
        vertical: lines.filter((line) => line.style.height === "100%"),
        horizontal: lines.filter((line) => line.style.height !== "100%"),
      }
    }

    expect(guides()).toBeNull()

    // Start drawing at a cell sharing the sibling's left edge (column line 3)
    act(() => {
      placementCellAt(6, 3).dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
      )
    })
    expect(guides()).not.toBeNull()
    expect(guideLines().vertical.map((line) => line.style.left)).toEqual([
      "79px",
    ])
    expect(guideLines().horizontal).toHaveLength(0)

    // Sweeping until the right edges also line up adds the second guide
    act(() => {
      placementCellAt(6, 6).dispatchEvent(
        new MouseEvent("mouseover", {
          bubbles: true,
          cancelable: true,
          relatedTarget: document.body,
        }),
      )
    })
    expect(guideLines().vertical.map((line) => line.style.left)).toEqual([
      "79px",
      "239px",
    ])

    // Cancelling the drag removes the guides
    pressKey(placementCellAt(6, 6), "Escape")
    expect(guides()).toBeNull()

    // A cell adjacent to the sibling's right edge and flush with its top row
    // shows one guide per axis
    act(() => {
      placementCellAt(2, 7).dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
      )
    })
    expect(guideLines().vertical.map((line) => line.style.left)).toEqual([
      "239px",
    ])
    expect(guideLines().horizontal.map((line) => line.style.top)).toEqual([
      "31px",
    ])

    // Committing the drag removes the guides
    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"))
    })
    expect(guides()).toBeNull()

    // A drag sharing no grid line with the sibling never shows guides
    act(() => {
      placementCellAt(8, 9).dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
      )
    })
    expect(guides()).toBeNull()
    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"))
    })

    iframe.remove()
  })

  it("shows a canvas-center guide when the dragged selection is horizontally centered", () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    // Measurable geometry (480×320) so the guide has a position to assert
    // against: the canvas's horizontal center sits at 240px
    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    // A single block, so sibling-edge alignment can never contribute guides
    renderCanvasFormInEditorDrawer({
      type: "canvas",
      blocks: [BLOCKQUOTE_BLOCK],
    } as IsomerComponent)

    click(findButtonByText("Item 1")!)

    const guides = () =>
      previewDocument.querySelector("[data-canvas-alignment-guides]")

    expect(guides()).toBeNull()

    // Start drawing at column 4: margins are 3 and 8 columns — not centered
    act(() => {
      placementCellAt(2, 4).dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
      )
    })
    expect(guides()).toBeNull()

    // Sweeping to column 9 balances the margins (3 and 3): the canvas's
    // center line appears through the middle of the selection
    act(() => {
      placementCellAt(2, 9).dispatchEvent(
        new MouseEvent("mouseover", {
          bubbles: true,
          cancelable: true,
          relatedTarget: document.body,
        }),
      )
    })
    expect(guides()).not.toBeNull()
    const centerLines = Array.from(guides()!.children) as HTMLElement[]
    expect(centerLines).toHaveLength(1)
    expect(centerLines[0]!.style.height).toBe("100%")
    expect(centerLines[0]!.style.left).toBe("239px")

    // One more column to the right (margins 3 and 2) removes the guide
    act(() => {
      placementCellAt(2, 10).dispatchEvent(
        new MouseEvent("mouseover", {
          bubbles: true,
          cancelable: true,
          relatedTarget: document.body,
        }),
      )
    })
    expect(guides()).toBeNull()
    pressKey(placementCellAt(2, 10), "Escape")

    // A full-width selection is trivially centered and never shows the guide
    act(() => {
      placementCellAt(3, 1).dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
      )
    })
    act(() => {
      placementCellAt(3, 12).dispatchEvent(
        new MouseEvent("mouseover", {
          bubbles: true,
          cancelable: true,
          relatedTarget: document.body,
        }),
      )
    })
    expect(guides()).toBeNull()
    pressKey(placementCellAt(3, 12), "Escape")

    iframe.remove()
  })

  it("shows a live grid-area badge on the preview block while dragging", () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    const previewBlock = previewDocument.querySelector<HTMLElement>(
      '[data-canvas-block-index="0"]',
    )!

    renderCanvasFormInEditorDrawer({
      type: "canvas",
      blocks: [BLOCKQUOTE_BLOCK],
    } as IsomerComponent)

    click(findButtonByText("Item 1")!)

    const badge = () =>
      previewBlock.querySelector<HTMLElement>("[data-canvas-drag-badge]")

    // No badge until a drag starts
    expect(badge()).toBeNull()

    act(() => {
      placementCellAt(2, 3).dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
      )
    })
    expect(badge()?.textContent).toBe("Columns 3–3, rows 2–2")

    // The badge follows the sweep live
    act(() => {
      placementCellAt(4, 8).dispatchEvent(
        new MouseEvent("mouseover", {
          bubbles: true,
          cancelable: true,
          relatedTarget: document.body,
        }),
      )
    })
    expect(badge()?.textContent).toBe("Columns 3–8, rows 2–4")

    // Cancelling the drag removes the badge
    pressKey(placementCellAt(4, 8), "Escape")
    expect(badge()).toBeNull()

    // Committing a drag removes it too
    act(() => {
      placementCellAt(1, 2).dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
      )
    })
    expect(badge()).not.toBeNull()
    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"))
    })
    expect(badge()).toBeNull()

    iframe.remove()
  })

  it("moves and resizes a placed block by dragging it directly in the live preview", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    // Deterministic geometry: 12 × 40px columns and 32px base rows (the
    // iframe realm reports no gaps, padding, borders or row tracks)
    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    const previewBlock = previewDocument.querySelector<HTMLElement>(
      '[data-canvas-block-index="0"]',
    )!
    previewBlock.style.setProperty("--canvas-grid-column", "2 / span 4")
    previewBlock.style.setProperty("--canvas-grid-row", "1 / span 2")

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 4, rowStart: 1, rowSpan: 2 },
          },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )

    click(findButtonByText("Item 1")!)

    // The edited block advertises that it can be grabbed
    expect(previewBlock.style.cursor).toBe("move")

    // Grab a body cell of the block (row 1, col 3) and drag two columns
    // right and one row down (row 2, col 5): the whole block moves
    act(() => {
      previewBlock.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: 85,
          clientY: 16,
        }),
      )
    })
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.MouseEvent("mousemove", { clientX: 165, clientY: 48 }),
      )
    })
    // The preview follows live before the drag is released
    expect(previewBlock.style.getPropertyValue("--canvas-grid-column")).toBe(
      "4 / span 4",
    )
    expect(previewBlock.style.getPropertyValue("--canvas-grid-row")).toBe(
      "2 / span 2",
    )

    act(() => {
      iframe.contentWindow!.dispatchEvent(new iframeRealm.MouseEvent("mouseup"))
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    let lastChange = changes.at(-1) as
      | { blocks?: { placement?: unknown }[] }
      | undefined
    expect(lastChange?.blocks?.[0]?.placement).toEqual({
      colStart: 4,
      colSpan: 4,
      rowStart: 2,
      rowSpan: 2,
    })

    // Grab the block's top-left corner cell (row 2, col 4) and drag it to
    // row 1, col 2: the block resizes, anchored at its bottom-right corner
    act(() => {
      previewBlock.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: 125,
          clientY: 48,
        }),
      )
    })
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.MouseEvent("mousemove", { clientX: 45, clientY: 5 }),
      )
    })
    act(() => {
      iframe.contentWindow!.dispatchEvent(new iframeRealm.MouseEvent("mouseup"))
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    lastChange = changes.at(-1) as
      | { blocks?: { placement?: unknown }[] }
      | undefined
    expect(lastChange?.blocks?.[0]?.placement).toEqual({
      colStart: 2,
      colSpan: 6,
      rowStart: 1,
      rowSpan: 3,
    })

    iframe.remove()
  })

  it("constrains a Shift-drag of the preview block to a straight line", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    // Deterministic geometry: 12 × 40px columns and 32px base rows (the
    // iframe realm reports no gaps, padding, borders or row tracks)
    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    const previewBlock = previewDocument.querySelector<HTMLElement>(
      '[data-canvas-block-index="0"]',
    )!
    previewBlock.style.setProperty("--canvas-grid-column", "2 / span 4")
    previewBlock.style.setProperty("--canvas-grid-row", "1 / span 2")

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 4, rowStart: 1, rowSpan: 2 },
          },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )

    click(findButtonByText("Item 1")!)

    // Grab a body cell of the block (row 1, col 3), then sweep with Shift
    // held to row 2, col 5: the sweep is 2 columns right but only 1 row
    // down, so the move is constrained to the dominant (horizontal) axis
    // and the rows stay put
    act(() => {
      previewBlock.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: 85,
          clientY: 16,
        }),
      )
    })
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.MouseEvent("mousemove", {
          clientX: 165,
          clientY: 48,
          shiftKey: true,
        }),
      )
    })
    expect(previewBlock.style.getPropertyValue("--canvas-grid-column")).toBe(
      "4 / span 4",
    )
    expect(previewBlock.style.getPropertyValue("--canvas-grid-row")).toBe(
      "1 / span 2",
    )

    // Keep sweeping (row 3, col 6) with Shift still held: still a straight
    // horizontal move
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.MouseEvent("mousemove", {
          clientX: 205,
          clientY: 80,
          shiftKey: true,
        }),
      )
    })
    expect(previewBlock.style.getPropertyValue("--canvas-grid-column")).toBe(
      "5 / span 4",
    )
    expect(previewBlock.style.getPropertyValue("--canvas-grid-row")).toBe(
      "1 / span 2",
    )

    act(() => {
      iframe.contentWindow!.dispatchEvent(new iframeRealm.MouseEvent("mouseup"))
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const lastChange = changes.at(-1) as
      | { blocks?: { placement?: unknown }[] }
      | undefined
    expect(lastChange?.blocks?.[0]?.placement).toEqual({
      colStart: 5,
      colSpan: 4,
      rowStart: 1,
      rowSpan: 2,
    })

    iframe.remove()
  })

  it("shows corner resize handles on the edited block and resizes via a handle grab", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    // Deterministic geometry: 12 × 40px columns and 32px base rows
    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    const previewBlock = previewDocument.querySelector<HTMLElement>(
      '[data-canvas-block-index="0"]',
    )!
    previewBlock.style.setProperty("--canvas-grid-column", "2 / span 4")
    previewBlock.style.setProperty("--canvas-grid-row", "1 / span 2")

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 4, rowStart: 1, rowSpan: 2 },
          },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )

    const handlesOnBlock = () =>
      Array.from(
        previewBlock.querySelectorAll<HTMLElement>(
          "[data-canvas-selection-handle]",
        ),
      )

    // The list view shows no handles; opening the block's editor adds one
    // resize handle on each corner and edge midpoint, with resize cursors
    expect(handlesOnBlock()).toHaveLength(0)
    click(findButtonByText("Item 1")!)
    const handles = handlesOnBlock()
    expect(
      handles.map((handle) =>
        handle.getAttribute("data-canvas-selection-handle"),
      ),
    ).toEqual([
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right",
      "top",
      "bottom",
      "left",
      "right",
    ])
    expect(handles.map((handle) => handle.style.cursor)).toEqual([
      "nwse-resize",
      "nesw-resize",
      "nesw-resize",
      "nwse-resize",
      "ns-resize",
      "ns-resize",
      "ew-resize",
      "ew-resize",
    ])

    // The block covers columns 2–5 and rows 1–2, so its bottom-right corner
    // sits at (200, 64). Grabbing the bottom-right handle there and dragging
    // to row 3, column 7 resizes the block, anchored at its top-left corner
    const bottomRightHandle = handles[3]!
    act(() => {
      bottomRightHandle.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: 195,
          clientY: 60,
        }),
      )
    })
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.MouseEvent("mousemove", { clientX: 265, clientY: 80 }),
      )
    })
    act(() => {
      iframe.contentWindow!.dispatchEvent(new iframeRealm.MouseEvent("mouseup"))
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const lastChange = changes.at(-1) as
      | { blocks?: { placement?: unknown }[] }
      | undefined
    expect(lastChange?.blocks?.[0]?.placement).toEqual({
      colStart: 2,
      colSpan: 6,
      rowStart: 1,
      rowSpan: 3,
    })

    // Closing the editor removes the handles again
    const currentRoot = root!
    act(() => {
      currentRoot.unmount()
    })
    root = undefined
    expect(handlesOnBlock()).toHaveLength(0)

    iframe.remove()
  })

  it("resizes along one axis only when an edge handle is dragged", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    // Deterministic geometry: 12 × 40px columns and 32px base rows
    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    const previewBlock = previewDocument.querySelector<HTMLElement>(
      '[data-canvas-block-index="0"]',
    )!
    previewBlock.style.setProperty("--canvas-grid-column", "2 / span 4")
    previewBlock.style.setProperty("--canvas-grid-row", "1 / span 3")

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 4, rowStart: 1, rowSpan: 3 },
          },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    click(findButtonByText("Item 1")!)
    const rightHandle = previewBlock.querySelector<HTMLElement>(
      '[data-canvas-selection-handle="right"]',
    )!

    // The block covers columns 2–5 and rows 1–3, so the right edge handle
    // sits mid-height at (200, 48) — a body cell, which without the edge
    // lock would move the block instead of resizing it. Dragging the handle
    // to column 7 while also wandering down to row 4 must widen the block to
    // columns 2–7 and leave its rows 1–3 untouched.
    act(() => {
      rightHandle.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: 195,
          clientY: 48,
        }),
      )
    })
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.MouseEvent("mousemove", { clientX: 265, clientY: 110 }),
      )
    })
    act(() => {
      iframe.contentWindow!.dispatchEvent(new iframeRealm.MouseEvent("mouseup"))
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const lastChange = changes.at(-1) as
      | { blocks?: { placement?: unknown }[] }
      | undefined
    expect(lastChange?.blocks?.[0]?.placement).toEqual({
      colStart: 2,
      colSpan: 6,
      rowStart: 1,
      rowSpan: 3,
    })

    iframe.remove()
  })

  it("cancels a drag started in the live preview with Escape", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
      KeyboardEvent: typeof KeyboardEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    const previewBlock = previewDocument.querySelector<HTMLElement>(
      '[data-canvas-block-index="0"]',
    )!
    previewBlock.style.setProperty("--canvas-grid-column", "2 / span 4")
    previewBlock.style.setProperty("--canvas-grid-row", "1 / span 2")

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 4, rowStart: 1, rowSpan: 2 },
          },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )

    click(findButtonByText("Item 1")!)

    // Grab a body cell of the block and drag it two columns right and one
    // row down: the preview follows live and the grid guides appear
    act(() => {
      previewBlock.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: 85,
          clientY: 16,
        }),
      )
    })
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.MouseEvent("mousemove", { clientX: 165, clientY: 48 }),
      )
    })
    expect(previewBlock.style.getPropertyValue("--canvas-grid-column")).toBe(
      "4 / span 4",
    )
    expect(container.textContent).toContain("Columns 4–7, rows 2–3")
    expect(
      previewDocument.querySelector("[data-canvas-grid-overlay]"),
    ).not.toBeNull()

    // Escape pressed while focus sits in the preview iframe cancels the
    // drag: the block snaps back, the guides disappear, and the picker
    // shows the saved placement again
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        }),
      )
    })
    expect(previewBlock.style.getPropertyValue("--canvas-grid-column")).toBe(
      "2 / span 4",
    )
    expect(previewBlock.style.getPropertyValue("--canvas-grid-row")).toBe(
      "1 / span 2",
    )
    expect(
      previewDocument.querySelector("[data-canvas-grid-overlay]"),
    ).toBeNull()
    expect(container.textContent).toContain("Columns 2–5, rows 1–2")

    // Releasing the mouse after the cancel must not commit the stale drag
    act(() => {
      iframe.contentWindow!.dispatchEvent(new iframeRealm.MouseEvent("mouseup"))
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const movedCommitted = changes.some(
      (change) =>
        (change as { blocks?: { placement?: { colStart?: number } }[] })
          .blocks?.[0]?.placement?.colStart === 4,
    )
    expect(movedCommitted).toBe(false)

    iframe.remove()
  })

  it("gives an unplaced block its first placement by dragging it in the live preview", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    // Deterministic geometry: 12 × 40px columns and 32px base rows
    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    // An unplaced block stacks full-width; this one renders across all 12
    // columns and two base rows (the renderer emits 1 / -1 with no row)
    const previewBlock = previewDocument.querySelector<HTMLElement>(
      '[data-canvas-block-index="0"]',
    )!
    previewBlock.style.setProperty("--canvas-grid-column", "1 / -1")
    previewBlock.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 64,
      right: 480,
      bottom: 64,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [BLOCKQUOTE_BLOCK],
      } as IsomerComponent,
      (data) => changes.push(data),
    )

    click(findButtonByText("Item 1")!)

    // Even without a saved placement the block advertises grabbability
    expect(previewBlock.style.cursor).toBe("move")

    // Grab the footprint's top-left corner cell (row 1, col 1) and drag it
    // to row 1, col 7: the block resizes anchored at its bottom-right
    // footprint corner (row 2, col 12), becoming its first placement
    act(() => {
      previewBlock.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: 5,
          clientY: 5,
        }),
      )
    })
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.MouseEvent("mousemove", { clientX: 245, clientY: 16 }),
      )
    })
    // The preview follows live before the drag is released
    expect(previewBlock.style.getPropertyValue("--canvas-grid-column")).toBe(
      "7 / span 6",
    )
    expect(previewBlock.style.getPropertyValue("--canvas-grid-row")).toBe(
      "1 / span 2",
    )
    expect(container.textContent).toContain("Columns 7–12, rows 1–2")

    act(() => {
      iframe.contentWindow!.dispatchEvent(new iframeRealm.MouseEvent("mouseup"))
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const lastChange = changes.at(-1) as
      | { blocks?: { placement?: unknown }[] }
      | undefined
    expect(lastChange?.blocks?.[0]?.placement).toEqual({
      colStart: 7,
      colSpan: 6,
      rowStart: 1,
      rowSpan: 2,
    })

    iframe.remove()
  })

  it("does not commit a placement when a preview block is merely clicked", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    // Deterministic geometry: 12 × 40px columns and 32px base rows
    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    // An unplaced block: a stray click must not pin it to its footprint
    const previewBlock = previewDocument.querySelector<HTMLElement>(
      '[data-canvas-block-index="0"]',
    )!
    previewBlock.style.setProperty("--canvas-grid-column", "1 / -1")
    previewBlock.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 64,
      right: 480,
      bottom: 64,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [BLOCKQUOTE_BLOCK],
      } as IsomerComponent,
      (data) => changes.push(data),
    )

    click(findButtonByText("Item 1")!)
    // JsonForms emits an initial change on a later tick; flush it before
    // capturing the baseline
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const baselineChangeCount = changes.length

    // A plain click: mousedown and mouseup with no movement
    act(() => {
      previewBlock.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: 85,
          clientY: 16,
        }),
      )
    })
    // No drag starts, so no grid guides appear and no live feedback is shown
    expect(
      previewDocument.querySelector("[data-canvas-grid-overlay]"),
    ).toBeNull()
    expect(container.textContent).toContain("Not placed")
    act(() => {
      iframe.contentWindow!.dispatchEvent(new iframeRealm.MouseEvent("mouseup"))
    })

    // Pointer movement within the grabbed cell is still just a click
    act(() => {
      previewBlock.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: 85,
          clientY: 16,
        }),
      )
    })
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.MouseEvent("mousemove", { clientX: 95, clientY: 20 }),
      )
    })
    expect(
      previewDocument.querySelector("[data-canvas-grid-overlay]"),
    ).toBeNull()
    act(() => {
      iframe.contentWindow!.dispatchEvent(new iframeRealm.MouseEvent("mouseup"))
    })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(changes.length).toBe(baselineChangeCount)
    expect(container.textContent).toContain("Not placed")

    // The abandoned grabs do not poison a real drag afterwards: crossing
    // into another cell starts the drag and mouseup commits it
    act(() => {
      previewBlock.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: 85,
          clientY: 16,
        }),
      )
    })
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.MouseEvent("mousemove", { clientX: 165, clientY: 48 }),
      )
    })
    expect(
      previewDocument.querySelector("[data-canvas-grid-overlay]"),
    ).not.toBeNull()
    act(() => {
      iframe.contentWindow!.dispatchEvent(new iframeRealm.MouseEvent("mouseup"))
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const lastChange = changes.at(-1) as
      | { blocks?: { placement?: unknown }[] }
      | undefined
    expect(lastChange?.blocks?.[0]?.placement).toBeDefined()

    iframe.remove()
  })

  it("commits the canvas's size when its resize handle is dragged in the live preview", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div id="page">
        <div data-canvas-container="">
          <div data-canvas-block-index="0"></div>
        </div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      MouseEvent: typeof MouseEvent
    }

    // The width percentage resolves against the canvas's parent (the iframe
    // realm reports no padding or borders, so its content box is its rect)
    const parent = previewDocument.querySelector<HTMLElement>("#page")!
    parent.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 1000,
      height: 800,
      right: 1000,
      bottom: 800,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    // Mutable canvas geometry standing in for the native CSS resize the
    // browser performs between mousedown and mouseup
    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    const canvasSize = { width: 1000, height: 300 }
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: canvasSize.width,
      height: canvasSize.height,
      right: canvasSize.width,
      bottom: canvasSize.height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      { type: "canvas", blocks: [BLOCKQUOTE_BLOCK] } as IsomerComponent,
      (data) => changes.push(data),
    )

    // The size fields advertise the preview affordance
    expect(container.textContent).toContain("resize the canvas freely")

    // The published canvas has no native resize handle; the editor applies
    // it to the preview while the size editor is open
    expect(previewCanvas.style.resize).toBe("both")

    // Let JsonForms' initial onChange (emitted from an effect on a later
    // tick) land before counting the captured changes
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    // A drag that starts away from the bottom-right resize handle commits
    // nothing, even if the canvas happens to change size before release
    const changesBefore = changes.length
    act(() => {
      previewCanvas.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: 500,
          clientY: 150,
        }),
      )
    })
    canvasSize.width = 900
    // A press that never grabbed the handle also shows no live size badge
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.MouseEvent("mousemove"),
      )
    })
    expect(previewDocument.querySelector("[data-canvas-size-badge]")).toBeNull()
    act(() => {
      iframe.contentWindow!.dispatchEvent(new iframeRealm.MouseEvent("mouseup"))
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(changes).toHaveLength(changesBefore)
    canvasSize.width = 1000

    // Grab the handle (within 16px of the bottom-right corner) and release
    // once the canvas has been resized: both dimensions commit, the width as
    // a percentage of the parent's content box
    act(() => {
      previewCanvas.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: 995,
          clientY: 295,
        }),
      )
    })
    // While the handle is held, a Wix-style badge at the canvas's corner
    // shows the live size the release would commit, following the drag
    canvasSize.width = 800
    canvasSize.height = 400
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.MouseEvent("mousemove"),
      )
    })
    const sizeBadge = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-size-badge]",
    )
    expect(sizeBadge?.textContent).toBe("80% × 400px")
    canvasSize.width = 600
    canvasSize.height = 500
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.MouseEvent("mousemove"),
      )
    })
    expect(sizeBadge?.textContent).toBe("60% × 500px")
    act(() => {
      iframe.contentWindow!.dispatchEvent(new iframeRealm.MouseEvent("mouseup"))
    })
    // The badge is a drag-only affordance, removed on release
    expect(previewDocument.querySelector("[data-canvas-size-badge]")).toBeNull()
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    let lastChange = changes.at(-1) as
      | { width?: number; height?: number }
      | undefined
    expect(lastChange?.width).toBe(60)
    expect(lastChange?.height).toBe(500)

    // The numeric inputs are remounted to display the committed size
    const inputByLabel = (labelText: string) => {
      const label = Array.from(container.querySelectorAll("label")).find(
        (candidate) => candidate.textContent.includes(labelText),
      )
      return label?.closest(".chakra-form-control")?.querySelector("input")
    }
    expect(inputByLabel("Width (%)")?.value).toBe("60")
    expect(inputByLabel("Height (px)")?.value).toBe("500")

    // A height-only drag must not freeze the untouched width dimension
    act(() => {
      previewCanvas.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: 595,
          clientY: 495,
        }),
      )
    })
    canvasSize.height = 320
    act(() => {
      iframe.contentWindow!.dispatchEvent(new iframeRealm.MouseEvent("mouseup"))
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    lastChange = changes.at(-1) as
      | { width?: number; height?: number }
      | undefined
    expect(lastChange?.width).toBe(60)
    expect(lastChange?.height).toBe(320)

    // A handle drag that moves by whole pixels but resolves back to the
    // saved size (604px is still 60% of the parent, 320.4px still rounds to
    // 320) commits nothing, so it cannot spuriously dirty the page
    canvasSize.width = 600
    canvasSize.height = 318.8
    const zeroDeltaBaseline = changes.length
    act(() => {
      previewCanvas.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: 595,
          clientY: 310,
        }),
      )
    })
    canvasSize.width = 604
    canvasSize.height = 320.4
    act(() => {
      iframe.contentWindow!.dispatchEvent(new iframeRealm.MouseEvent("mouseup"))
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(changes).toHaveLength(zeroDeltaBaseline)
    expect(inputByLabel("Width (%)")?.value).toBe("60")
    expect(inputByLabel("Height (px)")?.value).toBe("320")

    // The abandoned commit does not poison a genuine resize afterwards
    act(() => {
      previewCanvas.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: 595,
          clientY: 312,
        }),
      )
    })
    canvasSize.width = 500
    canvasSize.height = 400
    act(() => {
      iframe.contentWindow!.dispatchEvent(new iframeRealm.MouseEvent("mouseup"))
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    lastChange = changes.at(-1) as
      | { width?: number; height?: number }
      | undefined
    expect(lastChange?.width).toBe(50)
    expect(lastChange?.height).toBe(400)

    // Closing the editor removes the editor-only resize affordance
    act(() => {
      root?.unmount()
    })
    root = undefined
    expect(previewCanvas.style.resize).toBe("")

    iframe.remove()
  })

  it("snaps the free-resize to 5% and 25px steps while Shift is held", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div id="page">
        <div data-canvas-container="">
          <div data-canvas-block-index="0"></div>
        </div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      MouseEvent: typeof MouseEvent
    }

    const parent = previewDocument.querySelector<HTMLElement>("#page")!
    parent.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 1000,
      height: 800,
      right: 1000,
      bottom: 800,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    // Mutable canvas geometry standing in for the native CSS resize the
    // browser performs between mousedown and mouseup
    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    const canvasSize = { width: 1000, height: 300 }
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: canvasSize.width,
      height: canvasSize.height,
      right: canvasSize.width,
      bottom: canvasSize.height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      { type: "canvas", blocks: [BLOCKQUOTE_BLOCK] } as IsomerComponent,
      (data) => changes.push(data),
    )
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    // Grab the handle and drag to an untidy size with Shift held: the live
    // badge already shows the snapped size the release would commit
    act(() => {
      previewCanvas.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: 995,
          clientY: 295,
        }),
      )
    })
    canvasSize.width = 634 // 63.4% of the parent
    canvasSize.height = 417
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.MouseEvent("mousemove", { shiftKey: true }),
      )
    })
    expect(
      previewDocument.querySelector("[data-canvas-size-badge]")?.textContent,
    ).toBe("65% × 425px")

    // Releasing with Shift held commits the snapped size
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.MouseEvent("mouseup", { shiftKey: true }),
      )
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    let lastChange = changes.at(-1) as
      | { width?: number; height?: number }
      | undefined
    expect(lastChange?.width).toBe(65)
    expect(lastChange?.height).toBe(425)

    // Snapping follows the live key state: the badge snaps while Shift is
    // down and reverts to the raw size when it is released mid-drag
    act(() => {
      previewCanvas.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: 630,
          clientY: 412,
        }),
      )
    })
    canvasSize.width = 612 // 61.2% of the parent
    canvasSize.height = 433
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.MouseEvent("mousemove", { shiftKey: true }),
      )
    })
    expect(
      previewDocument.querySelector("[data-canvas-size-badge]")?.textContent,
    ).toBe("60% × 425px")
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.MouseEvent("mousemove"),
      )
    })
    expect(
      previewDocument.querySelector("[data-canvas-size-badge]")?.textContent,
    ).toBe("61% × 433px")

    // A release without Shift commits the raw size — snapping is decided at
    // release time
    act(() => {
      iframe.contentWindow!.dispatchEvent(new iframeRealm.MouseEvent("mouseup"))
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    lastChange = changes.at(-1) as
      | { width?: number; height?: number }
      | undefined
    expect(lastChange?.width).toBe(61)
    expect(lastChange?.height).toBe(433)

    iframe.remove()
  })

  it("opens a block's editor by clicking it in the live preview and switches blocks by clicking siblings", () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><a href="/elsewhere">second</a></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    renderCanvasFormInEditorDrawer({
      type: "canvas",
      blocks: [
        BLOCKQUOTE_BLOCK,
        { type: "blockquote", quote: "Second quote", source: "s" },
      ],
    } as IsomerComponent)

    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    const firstBlock = previewDocument.querySelector<HTMLElement>(
      '[data-canvas-block-index="0"]',
    )!
    const secondBlockLink = previewDocument.querySelector<HTMLElement>(
      '[data-canvas-block-index="1"] a',
    )!

    // While the list view is showing, preview blocks advertise clickability
    expect(firstBlock.style.cursor).toBe("pointer")

    // Clicking the canvas background (outside every block) opens nothing
    act(() => {
      previewCanvas.dispatchEvent(
        new iframeRealm.MouseEvent("click", {
          bubbles: true,
          cancelable: true,
        }),
      )
    })
    expect(container.textContent).not.toContain("Edit Canvas blocks")

    // Clicking inside a block (here through its nested link) opens that
    // block's editor instead of navigating the preview
    let clickEvent: MouseEvent
    act(() => {
      clickEvent = new iframeRealm.MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      })
      secondBlockLink.dispatchEvent(clickEvent)
    })
    expect(clickEvent!.defaultPrevented).toBe(true)
    expect(container.textContent).toContain("Edit Canvas blocks")
    expect(container.textContent).toContain("Second quote")
    expect(container.textContent).not.toContain("A quote inside the canvas")

    // With the nested editor open, sibling blocks remain click targets:
    // clicking one switches the editor to it, Wix-style
    expect(firstBlock.style.cursor).toBe("pointer")
    act(() => {
      firstBlock.dispatchEvent(
        new iframeRealm.MouseEvent("click", {
          bubbles: true,
          cancelable: true,
        }),
      )
    })
    expect(container.textContent).toContain("A quote inside the canvas")
    expect(container.textContent).not.toContain("Second quote")

    // The newly selected block hands its click affordance to the placement
    // control (move cursor); its sibling becomes a click target again
    const secondBlock = previewDocument.querySelector<HTMLElement>(
      '[data-canvas-block-index="1"]',
    )!
    expect(firstBlock.style.cursor).toBe("move")
    expect(secondBlock.style.cursor).toBe("pointer")

    // Clicking the already-selected block switches nothing
    act(() => {
      firstBlock.dispatchEvent(
        new iframeRealm.MouseEvent("click", {
          bubbles: true,
          cancelable: true,
        }),
      )
    })
    expect(container.textContent).toContain("A quote inside the canvas")

    // A link inside a sibling still selects its block instead of navigating
    // the preview
    let switchBackClick: MouseEvent
    act(() => {
      switchBackClick = new iframeRealm.MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      })
      secondBlockLink.dispatchEvent(switchBackClick)
    })
    expect(switchBackClick!.defaultPrevented).toBe(true)
    expect(container.textContent).toContain("Second quote")
    expect(container.textContent).not.toContain("A quote inside the canvas")

    // Clicking the empty canvas background while a nested editor is open
    // deselects back to the block list, Wix-style; blocks regain their
    // click affordance
    act(() => {
      previewCanvas.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        }),
      )
      previewCanvas.dispatchEvent(
        new iframeRealm.MouseEvent("click", {
          bubbles: true,
          cancelable: true,
        }),
      )
    })
    expect(container.textContent).not.toContain("Edit Canvas blocks")
    expect(container.textContent).toContain("Add item")
    expect(firstBlock.style.cursor).toBe("pointer")
    expect(secondBlock.style.cursor).toBe("pointer")

    // A drag that starts on the edited block and is released over the
    // background must not deselect: the browser fires its click at the
    // canvas ancestor, but the press did not start outside every block
    act(() => {
      firstBlock.dispatchEvent(
        new iframeRealm.MouseEvent("click", {
          bubbles: true,
          cancelable: true,
        }),
      )
    })
    expect(container.textContent).toContain("A quote inside the canvas")
    act(() => {
      firstBlock.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        }),
      )
      previewCanvas.dispatchEvent(
        new iframeRealm.MouseEvent("mouseup", {
          bubbles: true,
          cancelable: true,
        }),
      )
      previewCanvas.dispatchEvent(
        new iframeRealm.MouseEvent("click", {
          bubbles: true,
          cancelable: true,
        }),
      )
    })
    expect(container.textContent).toContain("A quote inside the canvas")

    iframe.remove()
  })

  it("outlines a hovered block in the live preview, Wix-style", () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    renderCanvasFormInEditorDrawer({
      type: "canvas",
      blocks: [
        BLOCKQUOTE_BLOCK,
        { type: "image", src: "/an-image.png", alt: "An image" },
      ],
    } as IsomerComponent)

    const firstBlock = previewDocument.querySelector<HTMLElement>(
      '[data-canvas-block-index="0"]',
    )!
    const secondBlock = previewDocument.querySelector<HTMLElement>(
      '[data-canvas-block-index="1"]',
    )!
    const hoverLabelIn = (block: HTMLElement) =>
      block.querySelector<HTMLElement>("[data-canvas-hover-label]")

    // No outline or name label until a block is hovered
    expect(firstBlock.style.outline).toBe("")
    expect(secondBlock.style.outline).toBe("")
    expect(hoverLabelIn(firstBlock)).toBeNull()
    expect(hoverLabelIn(secondBlock)).toBeNull()

    // Hovering a block (here through its nested span) outlines it and names
    // it with a label chip
    act(() => {
      firstBlock.querySelector("span")!.dispatchEvent(
        new iframeRealm.MouseEvent("mouseover", {
          bubbles: true,
          cancelable: true,
        }),
      )
    })
    expect(firstBlock.style.outline).toContain("dashed")
    expect(hoverLabelIn(firstBlock)?.textContent).toBe("Quote")

    // Moving to a sibling hands the outline and label over, and the label
    // names the sibling's own block type
    act(() => {
      secondBlock.dispatchEvent(
        new iframeRealm.MouseEvent("mouseover", {
          bubbles: true,
          cancelable: true,
        }),
      )
    })
    expect(firstBlock.style.outline).toBe("")
    expect(hoverLabelIn(firstBlock)).toBeNull()
    expect(secondBlock.style.outline).toContain("dashed")
    expect(hoverLabelIn(secondBlock)?.textContent).toBe("Image")

    // Leaving the canvas clears it
    act(() => {
      secondBlock.dispatchEvent(
        new iframeRealm.MouseEvent("mouseout", {
          bubbles: true,
          cancelable: true,
          relatedTarget: previewDocument.body,
        }),
      )
    })
    expect(secondBlock.style.outline).toBe("")
    expect(hoverLabelIn(secondBlock)).toBeNull()

    // Moving between elements inside the same block keeps the outline
    act(() => {
      firstBlock.dispatchEvent(
        new iframeRealm.MouseEvent("mouseover", {
          bubbles: true,
          cancelable: true,
        }),
      )
      firstBlock.dispatchEvent(
        new iframeRealm.MouseEvent("mouseout", {
          bubbles: true,
          cancelable: true,
          relatedTarget: firstBlock.querySelector("span"),
        }),
      )
    })
    expect(firstBlock.style.outline).toContain("dashed")
    expect(hoverLabelIn(firstBlock)?.textContent).toBe("Quote")

    // Selecting the hovered block hands its outline to the selection
    // highlight (solid, owned by the placement control) and drops the label
    act(() => {
      firstBlock.dispatchEvent(
        new iframeRealm.MouseEvent("click", {
          bubbles: true,
          cancelable: true,
        }),
      )
    })
    expect(container.textContent).toContain("A quote inside the canvas")
    expect(firstBlock.style.outline).toContain("solid")
    expect(firstBlock.style.outline).not.toContain("dashed")
    expect(hoverLabelIn(firstBlock)).toBeNull()

    // Hovering the selected block never shows the hover outline or label
    act(() => {
      firstBlock.dispatchEvent(
        new iframeRealm.MouseEvent("mouseover", {
          bubbles: true,
          cancelable: true,
        }),
      )
    })
    expect(firstBlock.style.outline).toContain("solid")
    expect(firstBlock.style.outline).not.toContain("dashed")
    expect(hoverLabelIn(firstBlock)).toBeNull()

    // Siblings still show the hover affordance while an editor is open, and
    // a mid-drag pass over a sibling (button held) does not
    act(() => {
      secondBlock.dispatchEvent(
        new iframeRealm.MouseEvent("mouseover", {
          bubbles: true,
          cancelable: true,
          buttons: 1,
        }),
      )
    })
    expect(secondBlock.style.outline).toBe("")
    expect(hoverLabelIn(secondBlock)).toBeNull()
    act(() => {
      secondBlock.dispatchEvent(
        new iframeRealm.MouseEvent("mouseover", {
          bubbles: true,
          cancelable: true,
        }),
      )
    })
    expect(secondBlock.style.outline).toContain("dashed")
    expect(hoverLabelIn(secondBlock)?.textContent).toBe("Image")

    // Closing the editor mid-hover restores the outline and removes the label
    act(() => {
      root?.unmount()
    })
    root = undefined
    expect(secondBlock.style.outline).toBe("")
    expect(hoverLabelIn(secondBlock)).toBeNull()

    iframe.remove()
  })

  it("outlines a block in the live preview while its row in the block list is hovered", () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    renderCanvasFormInEditorDrawer({
      type: "canvas",
      blocks: [
        BLOCKQUOTE_BLOCK,
        { type: "image", src: "/an-image.png", alt: "An image" },
      ],
    } as IsomerComponent)

    const firstBlock = previewDocument.querySelector<HTMLElement>(
      '[data-canvas-block-index="0"]',
    )!
    const secondBlock = previewDocument.querySelector<HTMLElement>(
      '[data-canvas-block-index="1"]',
    )!
    const hoverLabelIn = (block: HTMLElement) =>
      block.querySelector<HTMLElement>("[data-canvas-hover-label]")
    const listRowAt = (index: number) => {
      const row = container.querySelector(
        `[data-rfd-draggable-id="blocks.${index}"]`,
      )
      expect(row).not.toBeNull()
      return row!
    }
    // React synthesises onMouseEnter/onMouseLeave from bubbling
    // mouseover/mouseout events whose relatedTarget lies outside the row
    const hoverListRow = (row: Element) => {
      act(() => {
        row.dispatchEvent(
          new MouseEvent("mouseover", {
            bubbles: true,
            cancelable: true,
            relatedTarget: document.body,
          }),
        )
      })
    }
    const unhoverListRow = (row: Element) => {
      act(() => {
        row.dispatchEvent(
          new MouseEvent("mouseout", {
            bubbles: true,
            cancelable: true,
            relatedTarget: document.body,
          }),
        )
      })
    }

    // No outline or name label until a row is hovered
    expect(firstBlock.style.outline).toBe("")
    expect(secondBlock.style.outline).toBe("")

    // Hovering a block's row outlines that block on the preview and names it,
    // exactly like hovering the block on the canvas itself
    hoverListRow(listRowAt(0))
    expect(firstBlock.style.outline).toContain("dashed")
    expect(hoverLabelIn(firstBlock)?.textContent).toBe("Quote")
    expect(secondBlock.style.outline).toBe("")

    // Moving to the sibling's row hands the affordance over
    unhoverListRow(listRowAt(0))
    hoverListRow(listRowAt(1))
    expect(firstBlock.style.outline).toBe("")
    expect(hoverLabelIn(firstBlock)).toBeNull()
    expect(secondBlock.style.outline).toContain("dashed")
    expect(hoverLabelIn(secondBlock)?.textContent).toBe("Image")

    // Leaving the list clears it
    unhoverListRow(listRowAt(1))
    expect(secondBlock.style.outline).toBe("")
    expect(hoverLabelIn(secondBlock)).toBeNull()

    // Opening a block's editor by clicking its hovered row drops the row
    // hover affordance — the row list unmounts, so its mouseleave never
    // fires — and the placement control's solid highlight takes over
    hoverListRow(listRowAt(0))
    expect(firstBlock.style.outline).toContain("dashed")
    click(listRowAt(0).querySelector("button")!)
    expect(container.textContent).toContain("A quote inside the canvas")
    expect(firstBlock.style.outline).toContain("solid")
    expect(firstBlock.style.outline).not.toContain("dashed")
    expect(hoverLabelIn(firstBlock)).toBeNull()

    iframe.remove()
  })

  it("selects a block and drags it with the same press, Wix-style", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    // Deterministic geometry: 12 × 40px columns and 32px base rows; the two
    // unplaced blocks stack full-width, one above the other
    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    const firstBlock = previewDocument.querySelector<HTMLElement>(
      '[data-canvas-block-index="0"]',
    )!
    firstBlock.style.setProperty("--canvas-grid-column", "1 / -1")
    firstBlock.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 64,
      right: 480,
      bottom: 64,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    const secondBlock = previewDocument.querySelector<HTMLElement>(
      '[data-canvas-block-index="1"]',
    )!
    secondBlock.style.setProperty("--canvas-grid-column", "1 / -1")
    secondBlock.getBoundingClientRect = () => ({
      left: 0,
      top: 64,
      width: 480,
      height: 64,
      right: 480,
      bottom: 128,
      x: 0,
      y: 64,
      toJSON: () => ({}),
    })

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          BLOCKQUOTE_BLOCK,
          { type: "blockquote", quote: "Second quote", source: "s" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )

    // Pressing a block in the list view selects it immediately — no release
    // needed — so the same gesture can continue as a drag
    act(() => {
      firstBlock.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: 85,
          clientY: 16,
        }),
      )
    })
    expect(container.textContent).toContain("Edit Canvas blocks")
    expect(container.textContent).toContain("A quote inside the canvas")

    // Releasing without crossing into another grid cell is a plain
    // selection: no drag starts and no placement is committed
    act(() => {
      iframe.contentWindow!.dispatchEvent(new iframeRealm.MouseEvent("mouseup"))
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(
      previewDocument.querySelector("[data-canvas-grid-overlay]"),
    ).toBeNull()
    const selectOnlyChange = changes.at(-1) as
      | { blocks?: { placement?: unknown }[] }
      | undefined
    expect(selectOnlyChange?.blocks?.[0]?.placement).toBeUndefined()

    // Pressing a sibling switches the editor to it, and the press keeps
    // going: crossing into another cell starts moving that block
    act(() => {
      secondBlock.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: 85,
          clientY: 80,
        }),
      )
    })
    expect(container.textContent).toContain("Second quote")
    expect(container.textContent).not.toContain("A quote inside the canvas")
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.MouseEvent("mousemove", { clientX: 165, clientY: 112 }),
      )
    })
    expect(
      previewDocument.querySelector("[data-canvas-grid-overlay]"),
    ).not.toBeNull()
    expect(secondBlock.style.getPropertyValue("--canvas-grid-column")).toBe(
      "1 / span 12",
    )
    expect(secondBlock.style.getPropertyValue("--canvas-grid-row")).toBe(
      "4 / span 2",
    )

    // Releasing commits the moved placement through the usual path
    act(() => {
      iframe.contentWindow!.dispatchEvent(new iframeRealm.MouseEvent("mouseup"))
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const lastChange = changes.at(-1) as
      | { blocks?: { placement?: unknown }[] }
      | undefined
    expect(lastChange?.blocks?.[1]?.placement).toEqual({
      colStart: 1,
      colSpan: 12,
      rowStart: 4,
      rowSpan: 2,
    })

    iframe.remove()
  })

  it("leaves a copy of a block in place when Alt is held while dragging it in the live preview", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    // Deterministic geometry: 12 × 40px columns and 32px base rows
    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    const previewBlock = previewDocument.querySelector<HTMLElement>(
      '[data-canvas-block-index="0"]',
    )!
    previewBlock.style.setProperty("--canvas-grid-column", "2 / span 4")
    previewBlock.style.setProperty("--canvas-grid-row", "1 / span 2")

    const ORIGINAL_PLACEMENT = {
      colStart: 2,
      colSpan: 4,
      rowStart: 1,
      rowSpan: 2,
    }
    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [{ ...BLOCKQUOTE_BLOCK, placement: ORIGINAL_PLACEMENT }],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    // JsonForms emits its initial onChange on a later tick; flush it so the
    // background-press assertion below sees a stable baseline
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    // An Alt-press on the canvas background clones nothing
    act(() => {
      previewCanvas.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          altKey: true,
          clientX: 400,
          clientY: 300,
        }),
      )
      iframe.contentWindow!.dispatchEvent(new iframeRealm.MouseEvent("mouseup"))
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    const baselineChangeCount = changes.length

    // Alt-pressing the unselected block from the list view leaves a copy in
    // place while the same press selects the block and keeps going as a drag
    act(() => {
      previewBlock.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          altKey: true,
          clientX: 85,
          clientY: 16,
        }),
      )
    })
    expect(container.textContent).toContain("A quote inside the canvas")
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.MouseEvent("mousemove", { clientX: 165, clientY: 48 }),
      )
    })
    // The original block follows the drag live; the copy stays behind
    expect(previewBlock.style.getPropertyValue("--canvas-grid-column")).toBe(
      "4 / span 4",
    )
    act(() => {
      iframe.contentWindow!.dispatchEvent(new iframeRealm.MouseEvent("mouseup"))
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(changes.length).toBeGreaterThan(baselineChangeCount)
    let lastChange = changes.at(-1) as
      | { blocks?: { quote?: string; placement?: unknown }[] }
      | undefined
    expect(lastChange?.blocks).toHaveLength(2)
    expect(lastChange?.blocks?.[0]?.placement).toEqual({
      colStart: 4,
      colSpan: 4,
      rowStart: 2,
      rowSpan: 2,
    })
    expect(lastChange?.blocks?.[1]).toEqual({
      ...BLOCKQUOTE_BLOCK,
      placement: ORIGINAL_PLACEMENT,
    })

    // Alt-pressing the SELECTED block also clones it — its press never
    // bubbles past the placement control, so only a capture-phase listener
    // can see it — and the press continues as the usual move drag
    act(() => {
      previewBlock.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          altKey: true,
          clientX: 185,
          clientY: 80,
        }),
      )
    })
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.MouseEvent("mousemove", { clientX: 225, clientY: 112 }),
      )
    })
    act(() => {
      iframe.contentWindow!.dispatchEvent(new iframeRealm.MouseEvent("mouseup"))
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    lastChange = changes.at(-1) as
      | { blocks?: { quote?: string; placement?: unknown }[] }
      | undefined
    expect(lastChange?.blocks).toHaveLength(3)
    expect(lastChange?.blocks?.[0]?.placement).toEqual({
      colStart: 5,
      colSpan: 4,
      rowStart: 3,
      rowSpan: 2,
    })
    expect(lastChange?.blocks?.[2]?.placement).toEqual({
      colStart: 4,
      colSpan: 4,
      rowStart: 2,
      rowSpan: 2,
    })

    iframe.remove()
  })

  it("shows a Wix-style action toolbar on the selected block in the live preview", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    // One spare element (index 3) so a duplicated block's selection has a
    // rendered wrapper to attach the toolbar to
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
        <div data-canvas-block-index="2"><span>third</span></div>
        <div data-canvas-block-index="3"><span>fourth</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 4, rowStart: 1, rowSpan: 2 },
          },
          { type: "blockquote", quote: "The second quote", source: "Second" },
          { type: "blockquote", quote: "The third quote", source: "Third" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const toolbar = () =>
      previewDocument.querySelector<HTMLElement>(
        "[data-canvas-selection-toolbar]",
      )
    const toolbarButton = (label: string) => {
      const button = previewDocument.querySelector<HTMLButtonElement>(
        `[data-canvas-selection-toolbar] button[aria-label="${label}"]`,
      )
      expect(button).not.toBeNull()
      return button!
    }
    const clickToolbarButton = (label: string) => {
      act(() => {
        toolbarButton(label).click()
      })
    }
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }
    const lastQuotes = () =>
      (
        changes.at(-1) as { blocks?: { quote?: string }[] } | undefined
      )?.blocks?.map((block) => block.quote)

    // No toolbar while the block list is showing
    expect(toolbar()).toBeNull()

    // Selecting a block pins the toolbar to its preview wrapper, with the
    // stacking actions reflecting its place in the stack (a back-of-stack
    // block cannot be sent further backward)
    click(findButtonByText("Item 1")!)
    expect(container.textContent).toContain("Edit Canvas blocks")
    await flush()
    const firstBlock = previewDocument.querySelector<HTMLElement>(
      '[data-canvas-block-index="0"]',
    )!
    expect(
      firstBlock.querySelector("[data-canvas-selection-toolbar]"),
    ).not.toBeNull()
    expect(toolbarButton("Duplicate block (⌘D)").disabled).toBe(false)
    expect(toolbarButton("Delete block (Delete)").disabled).toBe(false)
    expect(toolbarButton("Bring forward (⌘])").disabled).toBe(false)
    expect(toolbarButton("Send backward (⌘[)").disabled).toBe(true)

    // Bring forward reorders the blocks, the editor follows the moved block
    // (its placement summary is unchanged), and the toolbar moves with it
    clickToolbarButton("Bring forward (⌘])")
    await flush()
    expect(lastQuotes()).toEqual([
      "The second quote",
      BLOCKQUOTE_BLOCK.quote,
      "The third quote",
    ])
    expect(container.textContent).toContain("Columns 2–5, rows 1–2")
    const secondWrapper = previewDocument.querySelector<HTMLElement>(
      '[data-canvas-block-index="1"]',
    )!
    expect(
      secondWrapper.querySelector("[data-canvas-selection-toolbar]"),
    ).not.toBeNull()
    expect(toolbarButton("Send backward (⌘[)").disabled).toBe(false)
    expect(toolbarButton("Bring forward (⌘])").disabled).toBe(false)

    // Duplicate appends a copy with its placement shifted one row down and
    // switches the editor to it; the copy is now at the front of the stack,
    // so it cannot be brought further forward
    clickToolbarButton("Duplicate block (⌘D)")
    await flush()
    const afterDuplicate = changes.at(-1) as
      | {
          blocks?: {
            quote?: string
            placement?: { rowStart?: number }
          }[]
        }
      | undefined
    expect(afterDuplicate?.blocks).toHaveLength(4)
    expect(afterDuplicate?.blocks?.[3]?.quote).toBe(BLOCKQUOTE_BLOCK.quote)
    expect(afterDuplicate?.blocks?.[3]?.placement?.rowStart).toBe(2)
    expect(container.textContent).toContain("Columns 2–5, rows 2–3")
    expect(toolbarButton("Bring forward (⌘])").disabled).toBe(true)
    expect(toolbarButton("Send backward (⌘[)").disabled).toBe(false)

    // Delete removes the copy and returns to the block list; the toolbar
    // leaves the preview with it
    clickToolbarButton("Delete block (Delete)")
    await flush()
    const afterDelete = changes.at(-1) as { blocks?: unknown[] } | undefined
    expect(afterDelete?.blocks).toHaveLength(3)
    expect(container.textContent).toContain("Add item")
    expect(toolbar()).toBeNull()

    iframe.remove()
  })

  it("shows a Wix-style group action toolbar on the multi-selection in the live preview", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    // More preview block elements than data blocks, so the toolbar has an
    // element to anchor to on the copies appended by the group duplicate
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
        <div data-canvas-block-index="2"><span>third</span></div>
        <div data-canvas-block-index="3"><span>fourth</span></div>
        <div data-canvas-block-index="4"><span>fifth</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 3, rowStart: 3, rowSpan: 1 },
          },
          {
            type: "blockquote",
            quote: "The second quote",
            source: "s2",
            placement: { colStart: 5, colSpan: 4, rowStart: 1, rowSpan: 2 },
          },
          { type: "blockquote", quote: "The third quote", source: "s3" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }
    const blockAt = (index: number) =>
      previewDocument.querySelector<HTMLElement>(
        `[data-canvas-block-index="${index}"]`,
      )!
    const shiftClick = (block: HTMLElement) => {
      act(() => {
        block.dispatchEvent(
          new iframeRealm.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
        block.dispatchEvent(
          new iframeRealm.MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
      })
    }
    const toolbar = () =>
      previewDocument.querySelector<HTMLElement>(
        "[data-canvas-selection-toolbar]",
      )
    const toolbarButton = (label: string) => {
      const button = previewDocument.querySelector<HTMLButtonElement>(
        `[data-canvas-selection-toolbar] button[aria-label="${label}"]`,
      )
      expect(button).not.toBeNull()
      return button!
    }
    const clickToolbarButton = (label: string) => {
      act(() => {
        toolbarButton(label).click()
      })
    }
    const latestBlocks = () =>
      (
        changes.at(-1) as
          | {
              blocks?: {
                quote?: string
                placement?: { rowStart?: number }
              }[]
            }
          | undefined
      )?.blocks

    // No toolbar while nothing is multi-selected
    await flush()
    expect(toolbar()).toBeNull()

    // Shift+clicking two blocks pins the group toolbar to the topmost placed
    // member, labelled for the group, with the arrange buttons reflecting
    // the group's place in the stack (a back-of-stack group cannot be sent
    // further back) — no editor opens and no data changes
    shiftClick(blockAt(0))
    shiftClick(blockAt(1))
    await flush()
    const baselineChangeCount = changes.length
    expect(container.textContent).not.toContain("Edit Canvas blocks")
    const groupToolbar = toolbar()!
    expect(groupToolbar.getAttribute("aria-label")).toBe("Group actions")
    expect(
      blockAt(1).querySelector("[data-canvas-selection-toolbar]"),
    ).not.toBeNull()
    expect(
      Array.from(groupToolbar.querySelectorAll("button")).map((button) =>
        button.getAttribute("aria-label"),
      ),
    ).toEqual([
      "Duplicate blocks (⌘D)",
      "Bring to front (⌘⇧])",
      "Send to back (⌘⇧[)",
      "Delete blocks (Delete)",
    ])
    expect(toolbarButton("Bring to front (⌘⇧])").disabled).toBe(false)
    expect(toolbarButton("Send to back (⌘⇧[)").disabled).toBe(true)

    // Bring to front moves both members to the end of the stack in one data
    // change; the selection follows, the toolbar re-anchors to the moved
    // topmost member, and the arrange buttons flip
    clickToolbarButton("Bring to front (⌘⇧])")
    await flush()
    expect(changes).toHaveLength(baselineChangeCount + 1)
    expect(latestBlocks()?.map((block) => block.quote)).toEqual([
      "The third quote",
      BLOCKQUOTE_BLOCK.quote,
      "The second quote",
    ])
    expect(
      blockAt(2).querySelector("[data-canvas-selection-toolbar]"),
    ).not.toBeNull()
    expect(toolbarButton("Bring to front (⌘⇧])").disabled).toBe(true)
    expect(toolbarButton("Send to back (⌘⇧[)").disabled).toBe(false)

    // Duplicate appends a copy of both members one row down in one data
    // change and hands the selection (and the toolbar) to the copies
    clickToolbarButton("Duplicate blocks (⌘D)")
    await flush()
    expect(changes).toHaveLength(baselineChangeCount + 2)
    const afterDuplicate = latestBlocks()
    expect(afterDuplicate).toHaveLength(5)
    expect(afterDuplicate?.[3]?.quote).toBe(BLOCKQUOTE_BLOCK.quote)
    expect(afterDuplicate?.[3]?.placement?.rowStart).toBe(4)
    expect(afterDuplicate?.[4]?.quote).toBe("The second quote")
    expect(afterDuplicate?.[4]?.placement?.rowStart).toBe(2)
    expect(
      blockAt(4).querySelector("[data-canvas-selection-toolbar]"),
    ).not.toBeNull()

    // Delete removes the copies in one data change; the emptied selection
    // takes the toolbar with it
    clickToolbarButton("Delete blocks (Delete)")
    await flush()
    expect(changes).toHaveLength(baselineChangeCount + 3)
    expect(latestBlocks()).toHaveLength(3)
    expect(toolbar()).toBeNull()

    iframe.remove()
  })

  it("opens a Wix-style right-click context menu on canvas blocks in the live preview", async () => {
    resetCanvasBlockClipboard()
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    // One spare element (index 3) so a duplicated block's selection has a
    // rendered wrapper
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
        <div data-canvas-block-index="2"><span>third</span></div>
        <div data-canvas-block-index="3"><span>fourth</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          BLOCKQUOTE_BLOCK,
          { type: "blockquote", quote: "The second quote", source: "Second" },
          { type: "blockquote", quote: "The third quote", source: "Third" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const menu = () =>
      previewDocument.querySelector<HTMLElement>("[data-canvas-context-menu]")
    const menuItem = (label: string) => {
      const item = Array.from(
        previewDocument.querySelectorAll<HTMLButtonElement>(
          "[data-canvas-context-menu] button",
        ),
      ).find((button) => button.textContent === label)
      expect(item).not.toBeUndefined()
      return item!
    }
    const rightClick = (
      element: Element,
      coords: Pick<MouseEventInit, "clientX" | "clientY">,
    ) => {
      const event = new iframeRealm.MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        ...coords,
      })
      act(() => {
        element.dispatchEvent(event)
      })
      return event
    }
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }
    await flush()

    // No menu while the block list is showing
    expect(menu()).toBeNull()

    // Right-clicking a block in list view selects it and opens the menu at
    // the pointer, suppressing the browser's native menu
    const secondBlock = previewDocument.querySelector(
      '[data-canvas-block-index="1"] span',
    )!
    const openEvent = rightClick(secondBlock, { clientX: 140, clientY: 90 })
    await flush()
    expect(openEvent.defaultPrevented).toBe(true)
    expect(container.textContent).toContain("Edit Canvas blocks")
    const openedMenu = menu()!
    expect(openedMenu.style.left).toBe("140px")
    expect(openedMenu.style.top).toBe("90px")
    // A mid-stack block can move both ways, one step or to either end
    expect(menuItem("Bring forward (⌘])").disabled).toBe(false)
    expect(menuItem("Send backward (⌘[)").disabled).toBe(false)
    expect(menuItem("Bring to front (⌘⇧])").disabled).toBe(false)
    expect(menuItem("Send to back (⌘⇧[)").disabled).toBe(false)

    // Choosing Duplicate closes the menu, appends a copy, and switches the
    // editor to it
    act(() => {
      menuItem("Duplicate block (⌘D)").click()
    })
    await flush()
    expect(menu()).toBeNull()
    const afterDuplicate = changes.at(-1) as
      | { blocks?: { quote?: string }[] }
      | undefined
    expect(afterDuplicate?.blocks).toHaveLength(4)
    expect(afterDuplicate?.blocks?.[3]?.quote).toBe("The second quote")

    // Right-clicking the selected copy shows its stack position: front of
    // the stack, so it cannot be brought further forward
    rightClick(
      previewDocument.querySelector('[data-canvas-block-index="3"] span')!,
      { clientX: 60, clientY: 40 },
    )
    await flush()
    expect(menu()).not.toBeNull()
    expect(menuItem("Bring forward (⌘])").disabled).toBe(true)
    expect(menuItem("Send backward (⌘[)").disabled).toBe(false)
    expect(menuItem("Bring to front (⌘⇧])").disabled).toBe(true)
    expect(menuItem("Send to back (⌘⇧[)").disabled).toBe(false)

    // Escape closes only the menu — the block stays selected
    pressKey(document.body, "Escape")
    await flush()
    expect(menu()).toBeNull()
    expect(container.textContent).toContain("Edit Canvas blocks")

    // A press outside the menu dismisses it without deselecting
    rightClick(
      previewDocument.querySelector('[data-canvas-block-index="3"] span')!,
      { clientX: 60, clientY: 40 },
    )
    await flush()
    expect(menu()).not.toBeNull()
    act(() => {
      previewDocument.querySelector("[data-canvas-container]")!.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        }),
      )
    })
    await flush()
    expect(menu()).toBeNull()
    expect(container.textContent).toContain("Edit Canvas blocks")

    // Right-clicking the empty canvas background keeps the native menu when
    // the canvas cannot be measured (zero-size here, so no grid cell for the
    // paste/add commands to target)
    const backgroundEvent = rightClick(
      previewDocument.querySelector("[data-canvas-container]")!,
      { clientX: 5, clientY: 5 },
    )
    await flush()
    expect(backgroundEvent.defaultPrevented).toBe(false)
    expect(menu()).toBeNull()

    // Choosing Send to back closes the menu and moves the front block behind
    // every sibling in one step
    rightClick(
      previewDocument.querySelector('[data-canvas-block-index="3"] span')!,
      { clientX: 60, clientY: 40 },
    )
    await flush()
    act(() => {
      menuItem("Send to back (⌘⇧[)").click()
    })
    await flush()
    expect(menu()).toBeNull()
    const afterSendToBack = changes.at(-1) as
      | { blocks?: { quote?: string }[] }
      | undefined
    expect(afterSendToBack?.blocks?.map((block) => block.quote)).toEqual([
      "The second quote",
      BLOCKQUOTE_BLOCK.quote,
      "The second quote",
      "The third quote",
    ])

    iframe.remove()
  })

  it("aligns the selected block's columns on the grid via the context menu", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>placed</span></div>
        <div data-canvas-block-index="1"><span>unplaced</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 4, colSpan: 3, rowStart: 2, rowSpan: 2 },
          },
          { type: "blockquote", quote: "Unplaced quote", source: "Second" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const menu = () =>
      previewDocument.querySelector<HTMLElement>("[data-canvas-context-menu]")
    const menuItem = (label: string) => {
      const item = Array.from(
        previewDocument.querySelectorAll<HTMLButtonElement>(
          "[data-canvas-context-menu] button",
        ),
      ).find((button) => button.textContent === label)
      expect(item).not.toBeUndefined()
      return item!
    }
    const rightClick = (element: Element) => {
      act(() => {
        element.dispatchEvent(
          new iframeRealm.MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
            clientX: 40,
            clientY: 40,
          }),
        )
      })
    }
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }
    const lastPlacement = () => {
      const latest = changes.at(-1) as
        | { blocks?: { placement?: Record<string, number> }[] }
        | undefined
      return latest?.blocks?.[0]?.placement
    }
    const placedBlock = previewDocument.querySelector(
      '[data-canvas-block-index="0"] span',
    )!
    const chooseAlign = async (label: string) => {
      rightClick(placedBlock)
      await flush()
      act(() => {
        menuItem(label).click()
      })
      await flush()
    }
    await flush()

    // Align left keeps the block's span and rows, moving it to column 1
    await chooseAlign("Align left")
    expect(menu()).toBeNull()
    expect(lastPlacement()).toEqual({
      colStart: 1,
      colSpan: 3,
      rowStart: 2,
      rowSpan: 2,
    })
    expect(container.textContent).toContain("Columns 1–3, rows 2–3")

    // Align right moves it against the last grid column
    await chooseAlign("Align right")
    expect(lastPlacement()).toEqual({
      colStart: 10,
      colSpan: 3,
      rowStart: 2,
      rowSpan: 2,
    })
    expect(container.textContent).toContain("Columns 10–12, rows 2–3")

    // Align center centres the span on the 12 columns
    await chooseAlign("Align center")
    expect(lastPlacement()).toEqual({
      colStart: 5,
      colSpan: 3,
      rowStart: 2,
      rowSpan: 2,
    })
    expect(container.textContent).toContain("Columns 5–7, rows 2–3")

    // Re-aligning to the position the block already holds commits nothing
    const changeCount = changes.length
    await chooseAlign("Align center")
    expect(changes.length).toBe(changeCount)
    expect(container.textContent).toContain("Columns 5–7, rows 2–3")

    // Stretch spans the block across the full grid width, rows untouched
    await chooseAlign("Stretch to full width")
    expect(lastPlacement()).toEqual({
      colStart: 1,
      colSpan: 12,
      rowStart: 2,
      rowSpan: 2,
    })
    expect(container.textContent).toContain("Columns 1–12, rows 2–3")

    // An unplaced block spans the full width already — nothing to align
    rightClick(
      previewDocument.querySelector('[data-canvas-block-index="1"] span')!,
    )
    await flush()
    expect(menuItem("Align left").disabled).toBe(true)
    expect(menuItem("Align center").disabled).toBe(true)
    expect(menuItem("Align right").disabled).toBe(true)
    expect(menuItem("Stretch to full width").disabled).toBe(true)

    iframe.remove()
  })

  it("copies, cuts, and pastes canvas blocks via the right-click context menu", async () => {
    resetCanvasBlockClipboard()
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    // Spare wrappers (indices 2-3) so pasted copies' selections have
    // rendered elements
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
        <div data-canvas-block-index="2"><span>third</span></div>
        <div data-canvas-block-index="3"><span>fourth</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 4, rowStart: 1, rowSpan: 1 },
          },
          { type: "blockquote", quote: "The second quote", source: "Second" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const menu = () =>
      previewDocument.querySelector<HTMLElement>("[data-canvas-context-menu]")
    const menuItem = (label: string) => {
      const item = Array.from(
        previewDocument.querySelectorAll<HTMLButtonElement>(
          "[data-canvas-context-menu] button",
        ),
      ).find((button) => button.textContent === label)
      expect(item).not.toBeUndefined()
      return item!
    }
    const rightClick = (element: Element) => {
      act(() => {
        element.dispatchEvent(
          new iframeRealm.MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
            clientX: 40,
            clientY: 40,
          }),
        )
      })
    }
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }
    const lastBlocks = () =>
      (
        changes.at(-1) as
          | {
              blocks?: {
                quote?: string
                placement?: Record<string, number>
              }[]
            }
          | undefined
      )?.blocks
    await flush()

    // With an empty block clipboard, Paste is disabled while Copy/Cut act
    rightClick(
      previewDocument.querySelector('[data-canvas-block-index="0"] span')!,
    )
    await flush()
    expect(menuItem("Copy block (⌘C)").disabled).toBe(false)
    expect(menuItem("Cut block (⌘X)").disabled).toBe(false)
    expect(menuItem("Paste block (⌘V)").disabled).toBe(true)

    // Copy closes the menu and commits no data change
    const changeCount = changes.length
    act(() => {
      menuItem("Copy block (⌘C)").click()
    })
    await flush()
    expect(menu()).toBeNull()
    expect(changes.length).toBe(changeCount)

    // Paste is now enabled: it appends a copy with its placement shifted one
    // row down and switches the editor to the pasted copy
    rightClick(
      previewDocument.querySelector('[data-canvas-block-index="0"] span')!,
    )
    await flush()
    const pasteItem = menuItem("Paste block (⌘V)")
    expect(pasteItem.disabled).toBe(false)
    act(() => {
      pasteItem.click()
    })
    await flush()
    expect(menu()).toBeNull()
    expect(lastBlocks()).toHaveLength(3)
    expect(lastBlocks()?.[2]?.quote).toBe(BLOCKQUOTE_BLOCK.quote)
    expect(lastBlocks()?.[2]?.placement).toEqual({
      colStart: 2,
      colSpan: 4,
      rowStart: 2,
      rowSpan: 1,
    })
    expect(container.textContent).toContain("Columns 2–5, rows 2–2")

    // Cut removes the block, returning to the block list with the cut block
    // held in the clipboard
    rightClick(
      previewDocument.querySelector('[data-canvas-block-index="1"] span')!,
    )
    await flush()
    act(() => {
      menuItem("Cut block (⌘X)").click()
    })
    await flush()
    expect(menu()).toBeNull()
    expect(lastBlocks()).toHaveLength(2)
    expect(
      lastBlocks()?.some((block) => block.quote === "The second quote"),
    ).toBe(false)
    expect(container.textContent).toContain("Add item")

    // Pasting from the menu puts the cut block back; it had no placement, so
    // the pasted copy is unplaced too
    rightClick(
      previewDocument.querySelector('[data-canvas-block-index="0"] span')!,
    )
    await flush()
    act(() => {
      menuItem("Paste block (⌘V)").click()
    })
    await flush()
    expect(lastBlocks()).toHaveLength(3)
    expect(lastBlocks()?.[2]?.quote).toBe("The second quote")
    expect(lastBlocks()?.[2]?.placement).toBeUndefined()

    iframe.remove()
  })

  it("pastes the clipboard block at the right-clicked grid cell via the background context menu", async () => {
    resetCanvasBlockClipboard()
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    // Spare wrappers (indices 2-4) so pasted copies' selections have
    // rendered elements
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
        <div data-canvas-block-index="2"><span>third</span></div>
        <div data-canvas-block-index="3"><span>fourth</span></div>
        <div data-canvas-block-index="4"><span>fifth</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    // 480px content box over 12 columns (empty computed styles read as zero
    // gaps/padding/borders in jsdom) puts a column every 40px and a base row
    // every 32px
    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 4, rowStart: 1, rowSpan: 1 },
          },
          { type: "blockquote", quote: "The second quote", source: "Second" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const menu = () =>
      previewDocument.querySelector<HTMLElement>("[data-canvas-context-menu]")
    const menuItem = (label: string) => {
      const item = Array.from(
        previewDocument.querySelectorAll<HTMLButtonElement>(
          "[data-canvas-context-menu] button",
        ),
      ).find((button) => button.textContent === label)
      expect(item).not.toBeUndefined()
      return item!
    }
    const rightClick = (
      element: Element,
      coords: Pick<MouseEventInit, "clientX" | "clientY">,
    ) => {
      const event = new iframeRealm.MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        ...coords,
      })
      act(() => {
        element.dispatchEvent(event)
      })
      return event
    }
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }
    const lastBlocks = () =>
      (
        changes.at(-1) as
          | {
              blocks?: {
                quote?: string
                placement?: Record<string, number>
              }[]
            }
          | undefined
      )?.blocks
    await flush()

    // Right-clicking the background with an empty block clipboard still
    // opens the menu — the add commands need no clipboard — with the paste
    // command disabled
    const emptyClipboardEvent = rightClick(previewCanvas, {
      clientX: 200,
      clientY: 100,
    })
    await flush()
    expect(emptyClipboardEvent.defaultPrevented).toBe(true)
    expect(menuItem("Paste block here").disabled).toBe(true)
    act(() => {
      previewDocument.querySelector("[data-canvas-container]")!.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        }),
      )
    })
    await flush()
    expect(menu()).toBeNull()

    // Copy the unplaced second block, dismissing its menu without pasting
    rightClick(
      previewDocument.querySelector('[data-canvas-block-index="1"] span')!,
      { clientX: 40, clientY: 40 },
    )
    await flush()
    act(() => {
      menuItem("Copy block (⌘C)").click()
    })
    await flush()

    // Right-clicking the background now opens the menu at the pointer, with
    // "Paste block here" enabled
    const backgroundEvent = rightClick(previewCanvas, {
      clientX: 250,
      clientY: 100,
    })
    await flush()
    expect(backgroundEvent.defaultPrevented).toBe(true)
    const openedMenu = menu()!
    expect(openedMenu.style.left).toBe("250px")
    expect(openedMenu.style.top).toBe("100px")
    expect(menuItem("Paste block here").disabled).toBe(false)

    // Pasting the unplaced block pins it full width at the clicked row
    // (clientY 100 → row 4); the editor switches to the pasted copy
    act(() => {
      menuItem("Paste block here").click()
    })
    await flush()
    expect(menu()).toBeNull()
    expect(lastBlocks()).toHaveLength(3)
    expect(lastBlocks()?.[2]?.quote).toBe("The second quote")
    expect(lastBlocks()?.[2]?.placement).toEqual({
      colStart: 1,
      colSpan: 12,
      rowStart: 4,
      rowSpan: 1,
    })
    expect(container.textContent).toContain("Columns 1–12, rows 4–4")

    // Copy the placed first block, then paste it near the right edge: the
    // block keeps its 4-column span with its top-left corner at the clicked
    // cell, clamped so it stays on the grid (clientX 470 → column 12 →
    // clamped to start at column 9)
    rightClick(
      previewDocument.querySelector('[data-canvas-block-index="0"] span')!,
      { clientX: 40, clientY: 40 },
    )
    await flush()
    act(() => {
      menuItem("Copy block (⌘C)").click()
    })
    await flush()
    rightClick(previewCanvas, { clientX: 470, clientY: 10 })
    await flush()
    act(() => {
      menuItem("Paste block here").click()
    })
    await flush()
    expect(lastBlocks()).toHaveLength(4)
    expect(lastBlocks()?.[3]?.quote).toBe(BLOCKQUOTE_BLOCK.quote)
    expect(lastBlocks()?.[3]?.placement).toEqual({
      colStart: 9,
      colSpan: 4,
      rowStart: 1,
      rowSpan: 1,
    })
    expect(container.textContent).toContain("Columns 9–12, rows 1–1")

    iframe.remove()
  })

  it("selects a covered block underneath the right-clicked block via the context menu", async () => {
    resetCanvasBlockClipboard()
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>bottom</span></div>
        <div data-canvas-block-index="1"><span>top</span></div>
        <div data-canvas-block-index="2"><span>far</span></div>
        <div data-canvas-block-index="3"><span>unplaced</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    // 480px content box over 12 columns (empty computed styles read as zero
    // gaps/padding/borders in jsdom) puts a column every 40px and a base row
    // every 32px
    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          // The bottom block's area (columns 4-9, rows 2-4) fully contains
          // the top block (columns 5-6, row 3), so the bottom one cannot be
          // reached by clicking the preview
          {
            type: "blockquote",
            quote: "The bottom quote",
            source: "Bottom",
            placement: { colStart: 4, colSpan: 6, rowStart: 2, rowSpan: 3 },
          },
          {
            type: "blockquote",
            quote: "The top quote",
            source: "Top",
            placement: { colStart: 5, colSpan: 2, rowStart: 3, rowSpan: 1 },
          },
          {
            type: "blockquote",
            quote: "The far quote",
            source: "Far",
            placement: { colStart: 11, colSpan: 2, rowStart: 8, rowSpan: 1 },
          },
          { type: "blockquote", quote: "The unplaced quote", source: "Loose" },
        ],
      },
      (data) => changes.push(data),
    )
    const menu = () =>
      previewDocument.querySelector<HTMLElement>("[data-canvas-context-menu]")
    const underneathItems = () =>
      Array.from(
        previewDocument.querySelectorAll<HTMLButtonElement>(
          "[data-canvas-context-menu] button",
        ),
      ).filter((button) => button.textContent?.includes("underneath"))
    const rightClick = (
      element: Element,
      coords: Pick<MouseEventInit, "clientX" | "clientY">,
    ) => {
      const event = new iframeRealm.MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        ...coords,
      })
      act(() => {
        element.dispatchEvent(event)
      })
      return event
    }
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }
    await flush()
    const baselineChangeCount = changes.length

    // Right-clicking the top block inside the overlap (clientX 180 → column
    // 5, clientY 70 → row 3) selects it and offers to select the covered
    // block underneath — but not the far or unplaced siblings
    rightClick(
      previewDocument.querySelector('[data-canvas-block-index="1"] span')!,
      { clientX: 180, clientY: 70 },
    )
    await flush()
    expect(menu()).not.toBeNull()
    expect(container.textContent).toContain("Columns 5–6, rows 3–3")
    const items = underneathItems()
    expect(items.map((item) => item.textContent)).toEqual([
      "Select quote underneath (block 1)",
    ])

    // Choosing it closes the menu and switches the editor to the covered
    // block, without committing any data change
    act(() => {
      items[0]!.click()
    })
    await flush()
    expect(menu()).toBeNull()
    expect(container.textContent).toContain("Columns 4–9, rows 2–4")
    expect(container.textContent).not.toContain("Columns 5–6, rows 3–3")
    expect(changes.length).toBe(baselineChangeCount)

    // Right-clicking the far block, whose cell no other block covers, offers
    // no underneath items
    rightClick(
      previewDocument.querySelector('[data-canvas-block-index="2"] span')!,
      { clientX: 420, clientY: 240 },
    )
    await flush()
    expect(menu()).not.toBeNull()
    expect(underneathItems()).toHaveLength(0)

    iframe.remove()
  })

  it("adds a default block at the right-clicked grid cell via the background context menu", async () => {
    resetCanvasBlockClipboard()
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    // Spare wrappers (indices 1-2) so added blocks' selections have rendered
    // elements
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
        <div data-canvas-block-index="2"><span>third</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    // 480px content box over 12 columns (empty computed styles read as zero
    // gaps/padding/borders in jsdom) puts a column every 40px and a base row
    // every 32px
    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [BLOCKQUOTE_BLOCK],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const menu = () =>
      previewDocument.querySelector<HTMLElement>("[data-canvas-context-menu]")
    const menuItem = (label: string) => {
      const item = Array.from(
        previewDocument.querySelectorAll<HTMLButtonElement>(
          "[data-canvas-context-menu] button",
        ),
      ).find((button) => button.textContent === label)
      expect(item).not.toBeUndefined()
      return item!
    }
    const rightClick = (
      element: Element,
      coords: Pick<MouseEventInit, "clientX" | "clientY">,
    ) => {
      const event = new iframeRealm.MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        ...coords,
      })
      act(() => {
        element.dispatchEvent(event)
      })
      return event
    }
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }
    const lastBlocks = () =>
      (
        changes.at(-1) as
          | {
              blocks?: {
                type?: string
                placement?: Record<string, number>
              }[]
            }
          | undefined
      )?.blocks
    await flush()

    // The background menu offers one add command per member of the canvas
    // schema's child-block union, so the menu cannot drift from the schema
    rightClick(previewCanvas, { clientX: 90, clientY: 70 })
    await flush()
    const unionTypes = (
      canvasSchema as unknown as {
        properties: {
          blocks: {
            items: { anyOf: { properties: { type: { const: string } } }[] }
          }
        }
      }
    ).properties.blocks.items.anyOf.map(
      (member) => member.properties.type.const,
    )
    expect(unionTypes.length).toBeGreaterThan(0)
    for (const type of unionTypes) {
      const label = BLOCK_TO_META[type as keyof typeof BLOCK_TO_META].label
      expect(menuItem(`Add ${label.toLowerCase()} here`).disabled).toBe(false)
    }
    // Paste and select-all plus one add command per union member, nothing
    // else
    expect(menu()!.querySelectorAll("button")).toHaveLength(
      2 + unionTypes.length,
    )

    // Adding an image lands the default image block with its top-left corner
    // on the clicked cell (clientX 90 → column 3, clientY 70 → row 3) at half
    // the grid's width, and the editor switches to it
    act(() => {
      menuItem("Add image here").click()
    })
    await flush()
    expect(menu()).toBeNull()
    expect(lastBlocks()).toHaveLength(2)
    expect(lastBlocks()?.[1]?.type).toBe("image")
    expect(lastBlocks()?.[1]?.placement).toEqual({
      colStart: 3,
      colSpan: 6,
      rowStart: 3,
      rowSpan: 1,
    })
    expect(container.textContent).toContain("Columns 3–8, rows 3–3")

    // Adding near the right edge clamps the start column so the block stays
    // on the grid (clientX 470 → column 12 → clamped to start at column 7)
    rightClick(previewCanvas, { clientX: 470, clientY: 10 })
    await flush()
    act(() => {
      menuItem("Add quote here").click()
    })
    await flush()
    expect(lastBlocks()).toHaveLength(3)
    expect(lastBlocks()?.[2]?.type).toBe("blockquote")
    expect(lastBlocks()?.[2]?.placement).toEqual({
      colStart: 7,
      colSpan: 6,
      rowStart: 1,
      rowSpan: 1,
    })
    expect(container.textContent).toContain("Columns 7–12, rows 1–1")

    iframe.remove()
  })

  it("shows the preview grid while the gridlines toggle is on, persisting across block selections without blocking Escape", async () => {
    resetCanvasShowGridPreference()
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 4, rowStart: 1, rowSpan: 2 },
          },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }
    const overlay = () =>
      previewDocument.querySelector("[data-canvas-grid-overlay]")
    const gridSwitch = () => {
      const label = Array.from(container.querySelectorAll("label")).find(
        (candidate) =>
          candidate.textContent.includes("Show grid on page preview"),
      )
      expect(label).not.toBeUndefined()
      const input = label!.querySelector<HTMLInputElement>(
        'input[type="checkbox"]',
      )
      expect(input).not.toBeNull()
      return input!
    }
    await flush()
    const baselineChangeCount = changes.length

    // Opening a block's editor shows no grid until the toggle is turned on
    click(findButtonByText("Item 1")!)
    await flush()
    expect(overlay()).toBeNull()
    expect(gridSwitch().checked).toBe(false)

    // Toggling the grid on draws the guides on the preview canvas with no
    // drag in progress and commits no data change
    click(gridSwitch())
    await flush()
    expect(gridSwitch().checked).toBe(true)
    expect(overlay()).not.toBeNull()
    expect(changes.length).toBe(baselineChangeCount)

    // Toggling it off removes the guides
    click(gridSwitch())
    expect(gridSwitch().checked).toBe(false)
    expect(overlay()).toBeNull()

    // With the toggle back on, Escape still deselects back to the block
    // list (the persistent overlay is not mistaken for an active drag), and
    // closing the editor removes the guides
    click(gridSwitch())
    expect(overlay()).not.toBeNull()
    pressKey(document.body, "Escape")
    await flush()
    expect(container.textContent).toContain("Item 1")
    expect(container.textContent).not.toContain("Edit Canvas blocks")
    expect(overlay()).toBeNull()

    // Reopening a block finds the preference persisted: the switch is still
    // on and the guides come straight back
    click(findButtonByText("Item 1")!)
    await flush()
    expect(gridSwitch().checked).toBe(true)
    expect(overlay()).not.toBeNull()
    expect(changes.length).toBe(baselineChangeCount)

    resetCanvasShowGridPreference()
    iframe.remove()
  })

  it("multi-selects blocks with Shift+click in the live preview and deletes them together", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
        <div data-canvas-block-index="2"><span>third</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          BLOCKQUOTE_BLOCK,
          { type: "blockquote", quote: "The second quote", source: "s2" },
          { type: "blockquote", quote: "The third quote", source: "s3" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }

    const blockAt = (index: number) =>
      previewDocument.querySelector<HTMLElement>(
        `[data-canvas-block-index="${index}"]`,
      )!
    const shiftClick = (block: HTMLElement) => {
      act(() => {
        block.dispatchEvent(
          new iframeRealm.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
        block.dispatchEvent(
          new iframeRealm.MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
      })
    }

    // Shift+clicking a block from the list view highlights it without
    // opening its editor
    shiftClick(blockAt(0))
    expect(container.textContent).not.toContain("Edit Canvas blocks")
    expect(blockAt(0).style.outline).toContain("solid")

    // Shift+clicking a sibling adds it to the multi-selection
    shiftClick(blockAt(2))
    expect(blockAt(0).style.outline).toContain("solid")
    expect(blockAt(2).style.outline).toContain("solid")
    expect(blockAt(1).style.outline).toBe("")

    // Shift+clicking a multi-selected block removes it from the selection
    shiftClick(blockAt(2))
    expect(blockAt(2).style.outline).toBe("")
    expect(blockAt(0).style.outline).toContain("solid")

    // Escape clears the multi-selection without deleting anything
    pressKey(document.body, "Escape")
    expect(blockAt(0).style.outline).toBe("")
    expect(container.textContent).toContain("Item 3")

    // With a block's editor open, Shift+clicking a sibling closes the editor
    // and seeds the multi-selection with both blocks
    click(findButtonByText("Item 2")!)
    expect(container.textContent).toContain("Edit Canvas blocks")
    await flush()
    shiftClick(blockAt(0))
    expect(container.textContent).not.toContain("Edit Canvas blocks")
    expect(container.textContent).toContain("Add item")
    expect(blockAt(0).style.outline).toContain("solid")
    expect(blockAt(1).style.outline).toContain("solid")
    expect(blockAt(2).style.outline).toBe("")

    // A plain press on the canvas background clears the multi-selection
    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    act(() => {
      previewCanvas.dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        }),
      )
      previewCanvas.dispatchEvent(
        new iframeRealm.MouseEvent("click", {
          bubbles: true,
          cancelable: true,
        }),
      )
    })
    expect(blockAt(0).style.outline).toBe("")
    expect(blockAt(1).style.outline).toBe("")
    await flush()
    const baselineChangeCount = changes.length

    // Delete removes every multi-selected block in one keystroke and one
    // data change, leaving only the unselected block behind
    shiftClick(blockAt(0))
    shiftClick(blockAt(2))
    pressKey(document.body, "Delete")
    await flush()
    expect(container.textContent).toContain("Item 1")
    expect(container.textContent).not.toContain("Item 2")
    expect(blockAt(0).style.outline).toBe("")
    expect(blockAt(2).style.outline).toBe("")
    const afterDelete = changes.at(-1) as
      | { blocks?: { quote?: string }[] }
      | undefined
    expect(changes.length).toBe(baselineChangeCount + 1)
    expect(afterDelete?.blocks).toHaveLength(1)
    expect(afterDelete?.blocks?.[0]?.quote).toBe("The second quote")

    iframe.remove()
  })

  it("moves the multi-selected blocks one grid cell with the arrow keys", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
        <div data-canvas-block-index="2"><span>third</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 3, rowStart: 2, rowSpan: 1 },
          },
          {
            type: "blockquote",
            quote: "The second quote",
            source: "s2",
            placement: { colStart: 1, colSpan: 4, rowStart: 1, rowSpan: 2 },
          },
          { type: "blockquote", quote: "The third quote", source: "s3" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }

    const blockAt = (index: number) =>
      previewDocument.querySelector<HTMLElement>(
        `[data-canvas-block-index="${index}"]`,
      )!
    const shiftClick = (block: HTMLElement) => {
      act(() => {
        block.dispatchEvent(
          new iframeRealm.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
        block.dispatchEvent(
          new iframeRealm.MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
      })
    }
    const placementAt = (index: number) => {
      const latest = changes.at(-1) as
        | { blocks?: { placement?: Record<string, number> }[] }
        | undefined
      return latest?.blocks?.[index]?.placement
    }

    await flush()
    shiftClick(blockAt(0))
    shiftClick(blockAt(1))
    const baselineChangeCount = changes.length

    // ArrowRight moves every placed member one column right in ONE data
    // change, keeping the multi-selection (and its highlight) intact
    pressKey(document.body, "ArrowRight")
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 1)
    expect(placementAt(0)).toEqual({
      colStart: 3,
      colSpan: 3,
      rowStart: 2,
      rowSpan: 1,
    })
    expect(placementAt(1)).toEqual({
      colStart: 2,
      colSpan: 4,
      rowStart: 1,
      rowSpan: 2,
    })
    expect(placementAt(2)).toBeUndefined()
    expect(blockAt(0).style.outline).toContain("solid")
    expect(blockAt(1).style.outline).toContain("solid")

    // ArrowDown shifts the group one row down
    pressKey(document.body, "ArrowDown")
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 2)
    expect(placementAt(0)?.rowStart).toBe(3)
    expect(placementAt(1)?.rowStart).toBe(2)

    // ArrowLeft moves the group back; a second ArrowLeft is blocked because
    // one member sits at the left grid edge — the group moves as a unit, so
    // nothing commits and no member moves
    pressKey(document.body, "ArrowLeft")
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 3)
    expect(placementAt(0)?.colStart).toBe(2)
    expect(placementAt(1)?.colStart).toBe(1)
    pressKey(document.body, "ArrowLeft")
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 3)

    // Same clamp at the top edge: the first ArrowUp fits, the second would
    // push a member off the grid and is ignored
    pressKey(document.body, "ArrowUp")
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 4)
    expect(placementAt(0)?.rowStart).toBe(2)
    expect(placementAt(1)?.rowStart).toBe(1)
    pressKey(document.body, "ArrowUp")
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 4)

    // A multi-selection holding only an unplaced block ignores the arrows —
    // an unplaced block has no grid position to shift
    pressKey(document.body, "Escape")
    shiftClick(blockAt(2))
    pressKey(document.body, "ArrowRight")
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 4)

    // A mixed selection moves only its placed members; the unplaced block
    // stays in the stacked flow without gaining a placement
    shiftClick(blockAt(0))
    pressKey(document.body, "ArrowDown")
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 5)
    expect(placementAt(0)?.rowStart).toBe(3)
    expect(placementAt(2)).toBeUndefined()

    iframe.remove()
  })

  it("duplicates the multi-selected blocks together with ⌘D", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    // More preview block elements than data blocks, so the highlight on the
    // copies appended by the group duplicate has elements to land on
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
        <div data-canvas-block-index="2"><span>third</span></div>
        <div data-canvas-block-index="3"><span>fourth</span></div>
        <div data-canvas-block-index="4"><span>fifth</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 3, rowStart: 1, rowSpan: 1 },
          },
          { type: "blockquote", quote: "The second quote", source: "s2" },
          { type: "blockquote", quote: "The third quote", source: "s3" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }

    const blockAt = (index: number) =>
      previewDocument.querySelector<HTMLElement>(
        `[data-canvas-block-index="${index}"]`,
      )!
    const shiftClick = (block: HTMLElement) => {
      act(() => {
        block.dispatchEvent(
          new iframeRealm.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
        block.dispatchEvent(
          new iframeRealm.MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
      })
    }
    const latestBlocks = () => {
      const latest = changes.at(-1) as
        | {
            blocks?: {
              quote?: string
              placement?: Record<string, number>
            }[]
          }
        | undefined
      return latest?.blocks
    }

    await flush()
    shiftClick(blockAt(0))
    shiftClick(blockAt(1))
    const baselineChangeCount = changes.length

    // ⌘D appends a copy of every multi-selected block in ONE data change:
    // the placed copy lands one row below its source, the unplaced copy
    // stays unplaced, and the originals are untouched
    pressKey(document.body, "d", { metaKey: true })
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 1)
    const blocks = latestBlocks()
    expect(blocks).toHaveLength(5)
    expect(blocks?.[0]?.placement).toEqual({
      colStart: 2,
      colSpan: 3,
      rowStart: 1,
      rowSpan: 1,
    })
    expect(blocks?.[3]?.quote).toBe("A quote inside the canvas")
    expect(blocks?.[3]?.placement).toEqual({
      colStart: 2,
      colSpan: 3,
      rowStart: 2,
      rowSpan: 1,
    })
    expect(blocks?.[4]?.quote).toBe("The second quote")
    expect(blocks?.[4]?.placement).toBeUndefined()

    // The multi-selection (and its highlight) moves to the copies, Wix-style,
    // so a follow-up group action acts on the duplicates
    expect(blockAt(0).style.outline).toBe("")
    expect(blockAt(1).style.outline).toBe("")
    expect(blockAt(3).style.outline).toContain("solid")
    expect(blockAt(4).style.outline).toContain("solid")

    // A second ⌘D duplicates the copies, cascading the placed one down again
    pressKey(document.body, "d", { metaKey: true })
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 2)
    const cascaded = latestBlocks()
    expect(cascaded).toHaveLength(7)
    expect(cascaded?.[5]?.placement?.rowStart).toBe(3)
    expect(cascaded?.[6]?.placement).toBeUndefined()

    iframe.remove()
  })

  it("opens a group context menu on the multi-selection in the live preview", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    // More preview block elements than data blocks, so the highlight on the
    // copies appended by the group duplicate has elements to land on
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
        <div data-canvas-block-index="2"><span>third</span></div>
        <div data-canvas-block-index="3"><span>fourth</span></div>
        <div data-canvas-block-index="4"><span>fifth</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 3, rowStart: 1, rowSpan: 1 },
          },
          { type: "blockquote", quote: "The second quote", source: "s2" },
          { type: "blockquote", quote: "The third quote", source: "s3" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }

    const blockAt = (index: number) =>
      previewDocument.querySelector<HTMLElement>(
        `[data-canvas-block-index="${index}"]`,
      )!
    const shiftClick = (block: HTMLElement) => {
      act(() => {
        block.dispatchEvent(
          new iframeRealm.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
        block.dispatchEvent(
          new iframeRealm.MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
      })
    }
    const menu = () =>
      previewDocument.querySelector<HTMLElement>("[data-canvas-context-menu]")
    const menuItemLabels = () =>
      Array.from(
        previewDocument.querySelectorAll<HTMLButtonElement>(
          "[data-canvas-context-menu] button",
        ),
      ).map((button) => button.textContent)
    const menuItem = (label: string) => {
      const item = Array.from(
        previewDocument.querySelectorAll<HTMLButtonElement>(
          "[data-canvas-context-menu] button",
        ),
      ).find((button) => button.textContent === label)
      expect(item).not.toBeUndefined()
      return item!
    }
    const rightClick = (
      element: Element,
      coords: Pick<MouseEventInit, "clientX" | "clientY">,
    ) => {
      const event = new iframeRealm.MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        ...coords,
      })
      act(() => {
        element.dispatchEvent(event)
      })
      return event
    }
    const latestBlocks = () => {
      const latest = changes.at(-1) as
        | { blocks?: { placement?: Record<string, number> }[] }
        | undefined
      return latest?.blocks
    }

    await flush()
    shiftClick(blockAt(0))
    shiftClick(blockAt(1))
    const baselineChangeCount = changes.length

    // Right-clicking a member of the multi-selection opens the group menu at
    // the pointer, keeping the set (and its highlight) intact and opening no
    // block editor
    const openEvent = rightClick(blockAt(1).querySelector("span")!, {
      clientX: 120,
      clientY: 80,
    })
    await flush()
    expect(openEvent.defaultPrevented).toBe(true)
    const openedMenu = menu()!
    expect(openedMenu.style.left).toBe("120px")
    expect(openedMenu.style.top).toBe("80px")
    expect(container.textContent).not.toContain("Edit Canvas blocks")
    expect(blockAt(0).style.outline).toContain("solid")
    expect(blockAt(1).style.outline).toContain("solid")
    expect(menuItemLabels()).toEqual([
      "Duplicate blocks (⌘D)",
      "Copy blocks (⌘C)",
      "Cut blocks (⌘X)",
      "Paste blocks (⌘V)",
      "Bring to front (⌘⇧])",
      "Send to back (⌘⇧[)",
      "Align left",
      "Align center",
      "Align right",
      "Align top",
      "Align middle",
      "Align bottom",
      "Distribute horizontally",
      "Distribute vertically",
      "Match width",
      "Match height",
      "Delete blocks (Delete)",
      "Clear selection (Escape)",
    ])

    // Escape closes only the menu — the multi-selection stays
    pressKey(document.body, "Escape")
    await flush()
    expect(menu()).toBeNull()
    expect(blockAt(0).style.outline).toContain("solid")
    expect(blockAt(1).style.outline).toContain("solid")
    expect(changes.length).toBe(baselineChangeCount)

    // Duplicate blocks appends a copy of every member in ONE data change,
    // with the selection moving to the copies
    rightClick(blockAt(0).querySelector("span")!, { clientX: 60, clientY: 40 })
    await flush()
    act(() => {
      menuItem("Duplicate blocks (⌘D)").click()
    })
    await flush()
    expect(menu()).toBeNull()
    expect(changes.length).toBe(baselineChangeCount + 1)
    expect(latestBlocks()).toHaveLength(5)
    expect(latestBlocks()?.[3]?.placement?.rowStart).toBe(2)
    expect(blockAt(0).style.outline).toBe("")
    expect(blockAt(3).style.outline).toContain("solid")
    expect(blockAt(4).style.outline).toContain("solid")

    // Delete blocks removes every member of the (moved) selection in one
    // data change
    rightClick(blockAt(4).querySelector("span")!, { clientX: 60, clientY: 40 })
    await flush()
    act(() => {
      menuItem("Delete blocks (Delete)").click()
    })
    await flush()
    expect(menu()).toBeNull()
    expect(changes.length).toBe(baselineChangeCount + 2)
    expect(latestBlocks()).toHaveLength(3)
    expect(blockAt(3).style.outline).toBe("")
    expect(blockAt(4).style.outline).toBe("")

    // Clear selection empties the set without touching the data
    shiftClick(blockAt(0))
    shiftClick(blockAt(1))
    rightClick(blockAt(0).querySelector("span")!, { clientX: 60, clientY: 40 })
    await flush()
    act(() => {
      menuItem("Clear selection (Escape)").click()
    })
    await flush()
    expect(menu()).toBeNull()
    expect(blockAt(0).style.outline).toBe("")
    expect(blockAt(1).style.outline).toBe("")
    expect(changes.length).toBe(baselineChangeCount + 2)

    // Right-clicking a block OUTSIDE the multi-selection keeps the existing
    // behavior: it selects that block (dropping the set) and opens the
    // single-block menu
    shiftClick(blockAt(0))
    shiftClick(blockAt(1))
    rightClick(blockAt(2).querySelector("span")!, { clientX: 60, clientY: 40 })
    await flush()
    expect(container.textContent).toContain("Edit Canvas blocks")
    expect(blockAt(0).style.outline).toBe("")
    expect(blockAt(1).style.outline).toBe("")
    const labels = menuItemLabels()
    expect(labels).toContain("Duplicate block (⌘D)")
    expect(labels).not.toContain("Duplicate blocks (⌘D)")

    iframe.remove()
  })

  it("aligns the multi-selected blocks within the group's bounding box via the group context menu", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
        <div data-canvas-block-index="2"><span>third</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 3, rowStart: 2, rowSpan: 2 },
          },
          {
            type: "blockquote",
            quote: "The second quote",
            source: "s2",
            placement: { colStart: 5, colSpan: 4, rowStart: 5, rowSpan: 1 },
          },
          { type: "blockquote", quote: "The third quote", source: "s3" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }

    const blockAt = (index: number) =>
      previewDocument.querySelector<HTMLElement>(
        `[data-canvas-block-index="${index}"]`,
      )!
    const shiftClick = (block: HTMLElement) => {
      act(() => {
        block.dispatchEvent(
          new iframeRealm.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
        block.dispatchEvent(
          new iframeRealm.MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
      })
    }
    const menu = () =>
      previewDocument.querySelector<HTMLElement>("[data-canvas-context-menu]")
    const menuItem = (label: string) => {
      const item = Array.from(
        previewDocument.querySelectorAll<HTMLButtonElement>(
          "[data-canvas-context-menu] button",
        ),
      ).find((button) => button.textContent === label)
      expect(item).not.toBeUndefined()
      return item!
    }
    const rightClick = (element: Element) => {
      act(() => {
        element.dispatchEvent(
          new iframeRealm.MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
            clientX: 60,
            clientY: 40,
          }),
        )
      })
    }
    const alignVia = async (label: string) => {
      rightClick(blockAt(0).querySelector("span")!)
      await flush()
      act(() => {
        menuItem(label).click()
      })
      await flush()
      expect(menu()).toBeNull()
    }
    const placementAt = (index: number) => {
      const latest = changes.at(-1) as
        | { blocks?: { placement?: Record<string, number> }[] }
        | undefined
      return latest?.blocks?.[index]?.placement
    }

    await flush()
    shiftClick(blockAt(0))
    shiftClick(blockAt(1))
    shiftClick(blockAt(2))
    const baselineChangeCount = changes.length

    // Align left pulls every placed member's left edge to the group's left
    // edge (column 2) in ONE data change; the unplaced member is untouched
    // and the multi-selection (and its highlight) stays intact
    await alignVia("Align left")
    expect(changes.length).toBe(baselineChangeCount + 1)
    expect(placementAt(0)).toEqual({
      colStart: 2,
      colSpan: 3,
      rowStart: 2,
      rowSpan: 2,
    })
    expect(placementAt(1)).toEqual({
      colStart: 2,
      colSpan: 4,
      rowStart: 5,
      rowSpan: 1,
    })
    expect(placementAt(2)).toBeUndefined()
    expect(blockAt(0).style.outline).toContain("solid")
    expect(blockAt(1).style.outline).toContain("solid")
    expect(blockAt(2).style.outline).toContain("solid")

    // Align right pushes every member's right edge to the group's right edge
    // (column 5 after the align-left): only the narrower block moves
    await alignVia("Align right")
    expect(changes.length).toBe(baselineChangeCount + 2)
    expect(placementAt(0)?.colStart).toBe(3)
    expect(placementAt(1)?.colStart).toBe(2)

    // Align center centres each member across the group's columns (2-5)
    await alignVia("Align center")
    expect(changes.length).toBe(baselineChangeCount + 3)
    expect(placementAt(0)?.colStart).toBe(2)
    expect(placementAt(1)?.colStart).toBe(2)

    // Align top lifts every member's top edge to the group's top row (2)
    await alignVia("Align top")
    expect(changes.length).toBe(baselineChangeCount + 4)
    expect(placementAt(0)?.rowStart).toBe(2)
    expect(placementAt(1)?.rowStart).toBe(2)

    // Align bottom drops each member's bottom edge to the group's bottom row
    // (3, set by the taller block)
    await alignVia("Align bottom")
    expect(changes.length).toBe(baselineChangeCount + 5)
    expect(placementAt(0)?.rowStart).toBe(2)
    expect(placementAt(1)?.rowStart).toBe(3)

    // Align middle centres each member down the group's rows
    await alignVia("Align middle")
    expect(changes.length).toBe(baselineChangeCount + 6)
    expect(placementAt(0)?.rowStart).toBe(2)
    expect(placementAt(1)?.rowStart).toBe(2)

    // Re-aligning an already-aligned group commits nothing, so the command
    // can never spuriously dirty the page
    await alignVia("Align middle")
    expect(changes.length).toBe(baselineChangeCount + 6)

    // With fewer than two placed members there is nothing to align against —
    // the align commands are disabled
    pressKey(document.body, "Escape")
    await flush()
    shiftClick(blockAt(1))
    shiftClick(blockAt(2))
    rightClick(blockAt(1).querySelector("span")!)
    await flush()
    expect(menuItem("Align left").disabled).toBe(true)
    expect(menuItem("Align middle").disabled).toBe(true)
    expect(menuItem("Duplicate blocks (⌘D)").disabled).toBe(false)
    pressKey(document.body, "Escape")
    await flush()

    iframe.remove()
  })

  it("distributes the multi-selected blocks' spacing via the group context menu", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
        <div data-canvas-block-index="2"><span>third</span></div>
        <div data-canvas-block-index="3"><span>fourth</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 1, colSpan: 2, rowStart: 1, rowSpan: 1 },
          },
          {
            type: "blockquote",
            quote: "The second quote",
            source: "s2",
            placement: { colStart: 4, colSpan: 2, rowStart: 2, rowSpan: 1 },
          },
          {
            type: "blockquote",
            quote: "The third quote",
            source: "s3",
            placement: { colStart: 9, colSpan: 2, rowStart: 6, rowSpan: 1 },
          },
          { type: "blockquote", quote: "The fourth quote", source: "s4" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }

    const blockAt = (index: number) =>
      previewDocument.querySelector<HTMLElement>(
        `[data-canvas-block-index="${index}"]`,
      )!
    const shiftClick = (block: HTMLElement) => {
      act(() => {
        block.dispatchEvent(
          new iframeRealm.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
        block.dispatchEvent(
          new iframeRealm.MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
      })
    }
    const menu = () =>
      previewDocument.querySelector<HTMLElement>("[data-canvas-context-menu]")
    const menuItem = (label: string) => {
      const item = Array.from(
        previewDocument.querySelectorAll<HTMLButtonElement>(
          "[data-canvas-context-menu] button",
        ),
      ).find((button) => button.textContent === label)
      expect(item).not.toBeUndefined()
      return item!
    }
    const rightClick = (element: Element) => {
      act(() => {
        element.dispatchEvent(
          new iframeRealm.MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
            clientX: 60,
            clientY: 40,
          }),
        )
      })
    }
    const distributeVia = async (label: string) => {
      rightClick(blockAt(0).querySelector("span")!)
      await flush()
      act(() => {
        menuItem(label).click()
      })
      await flush()
      expect(menu()).toBeNull()
    }
    const placementAt = (index: number) => {
      const latest = changes.at(-1) as
        | { blocks?: { placement?: Record<string, number> }[] }
        | undefined
      return latest?.blocks?.[index]?.placement
    }

    await flush()
    shiftClick(blockAt(0))
    shiftClick(blockAt(1))
    shiftClick(blockAt(2))
    shiftClick(blockAt(3))
    const baselineChangeCount = changes.length

    // Distribute horizontally equalizes the column gaps between consecutive
    // members (box columns 1-10, spans 2+2+2 leave 4 free columns → gaps of
    // 2), keeping the outermost members' edges fixed, in ONE data change: only
    // the middle block moves (column 4 → 5), rows are untouched, the unplaced
    // member is skipped, and the multi-selection (and its highlight) survives
    await distributeVia("Distribute horizontally")
    expect(changes.length).toBe(baselineChangeCount + 1)
    expect(placementAt(0)).toEqual({
      colStart: 1,
      colSpan: 2,
      rowStart: 1,
      rowSpan: 1,
    })
    expect(placementAt(1)).toEqual({
      colStart: 5,
      colSpan: 2,
      rowStart: 2,
      rowSpan: 1,
    })
    expect(placementAt(2)).toEqual({
      colStart: 9,
      colSpan: 2,
      rowStart: 6,
      rowSpan: 1,
    })
    expect(placementAt(3)).toBeUndefined()
    expect(blockAt(0).style.outline).toContain("solid")
    expect(blockAt(1).style.outline).toContain("solid")
    expect(blockAt(2).style.outline).toContain("solid")
    expect(blockAt(3).style.outline).toContain("solid")

    // Re-distributing an evenly-spaced group commits nothing, so the command
    // can never spuriously dirty the page
    await distributeVia("Distribute horizontally")
    expect(changes.length).toBe(baselineChangeCount + 1)

    // Distribute vertically equalizes the row gaps: box rows 1-6 with spans
    // 1+1+1 leave 3 free rows, so the fractional ideal gap of 1.5 rounds the
    // middle block to row 4 (gaps of 2 then 1)
    await distributeVia("Distribute vertically")
    expect(changes.length).toBe(baselineChangeCount + 2)
    expect(placementAt(0)?.rowStart).toBe(1)
    expect(placementAt(1)?.rowStart).toBe(4)
    expect(placementAt(2)?.rowStart).toBe(6)

    // With fewer than three placed members there are no middle blocks to
    // space out — the distribute commands are disabled while align (which
    // needs only two) stays enabled
    pressKey(document.body, "Escape")
    await flush()
    shiftClick(blockAt(0))
    shiftClick(blockAt(1))
    rightClick(blockAt(0).querySelector("span")!)
    await flush()
    expect(menuItem("Distribute horizontally").disabled).toBe(true)
    expect(menuItem("Distribute vertically").disabled).toBe(true)
    expect(menuItem("Align left").disabled).toBe(false)
    pressKey(document.body, "Escape")
    await flush()

    iframe.remove()
  })

  it("matches the multi-selected blocks' sizes via the group context menu", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
        <div data-canvas-block-index="2"><span>third</span></div>
        <div data-canvas-block-index="3"><span>fourth</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 1, colSpan: 2, rowStart: 1, rowSpan: 3 },
          },
          {
            type: "blockquote",
            quote: "The second quote",
            source: "s2",
            placement: { colStart: 4, colSpan: 6, rowStart: 2, rowSpan: 1 },
          },
          {
            type: "blockquote",
            quote: "The third quote",
            source: "s3",
            placement: { colStart: 9, colSpan: 4, rowStart: 5, rowSpan: 2 },
          },
          { type: "blockquote", quote: "The fourth quote", source: "s4" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }

    const blockAt = (index: number) =>
      previewDocument.querySelector<HTMLElement>(
        `[data-canvas-block-index="${index}"]`,
      )!
    const shiftClick = (block: HTMLElement) => {
      act(() => {
        block.dispatchEvent(
          new iframeRealm.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
        block.dispatchEvent(
          new iframeRealm.MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
      })
    }
    const menu = () =>
      previewDocument.querySelector<HTMLElement>("[data-canvas-context-menu]")
    const menuItem = (label: string) => {
      const item = Array.from(
        previewDocument.querySelectorAll<HTMLButtonElement>(
          "[data-canvas-context-menu] button",
        ),
      ).find((button) => button.textContent === label)
      expect(item).not.toBeUndefined()
      return item!
    }
    const rightClick = (element: Element) => {
      act(() => {
        element.dispatchEvent(
          new iframeRealm.MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
            clientX: 60,
            clientY: 40,
          }),
        )
      })
    }
    const matchVia = async (label: string) => {
      rightClick(blockAt(0).querySelector("span")!)
      await flush()
      act(() => {
        menuItem(label).click()
      })
      await flush()
      expect(menu()).toBeNull()
    }
    const placementAt = (index: number) => {
      const latest = changes.at(-1) as
        | { blocks?: { placement?: Record<string, number> }[] }
        | undefined
      return latest?.blocks?.[index]?.placement
    }

    await flush()
    shiftClick(blockAt(0))
    shiftClick(blockAt(1))
    shiftClick(blockAt(2))
    shiftClick(blockAt(3))
    const baselineChangeCount = changes.length

    // Match width resizes every placed member to the group's widest span (6)
    // in ONE data change: starts and rows are preserved, except the member
    // near the right edge (columns 9-12) shifts back to column 7 so the wider
    // span still fits the 12-column grid; the already-widest member and the
    // unplaced member are untouched, and the multi-selection (and its
    // highlight) survives
    await matchVia("Match width")
    expect(changes.length).toBe(baselineChangeCount + 1)
    expect(placementAt(0)).toEqual({
      colStart: 1,
      colSpan: 6,
      rowStart: 1,
      rowSpan: 3,
    })
    expect(placementAt(1)).toEqual({
      colStart: 4,
      colSpan: 6,
      rowStart: 2,
      rowSpan: 1,
    })
    expect(placementAt(2)).toEqual({
      colStart: 7,
      colSpan: 6,
      rowStart: 5,
      rowSpan: 2,
    })
    expect(placementAt(3)).toBeUndefined()
    expect(blockAt(0).style.outline).toContain("solid")
    expect(blockAt(1).style.outline).toContain("solid")
    expect(blockAt(2).style.outline).toContain("solid")
    expect(blockAt(3).style.outline).toContain("solid")

    // Re-matching an already-uniform group commits nothing, so the command
    // can never spuriously dirty the page
    await matchVia("Match width")
    expect(changes.length).toBe(baselineChangeCount + 1)

    // Match height resizes every placed member to the group's tallest span
    // (3), leaving row starts and the just-matched column spans untouched
    await matchVia("Match height")
    expect(changes.length).toBe(baselineChangeCount + 2)
    expect(placementAt(0)).toEqual({
      colStart: 1,
      colSpan: 6,
      rowStart: 1,
      rowSpan: 3,
    })
    expect(placementAt(1)).toEqual({
      colStart: 4,
      colSpan: 6,
      rowStart: 2,
      rowSpan: 3,
    })
    expect(placementAt(2)).toEqual({
      colStart: 7,
      colSpan: 6,
      rowStart: 5,
      rowSpan: 3,
    })

    // With fewer than two placed members there is no size to match — the
    // match commands are disabled while the group actions stay enabled
    pressKey(document.body, "Escape")
    await flush()
    shiftClick(blockAt(2))
    shiftClick(blockAt(3))
    rightClick(blockAt(2).querySelector("span")!)
    await flush()
    expect(menuItem("Match width").disabled).toBe(true)
    expect(menuItem("Match height").disabled).toBe(true)
    expect(menuItem("Duplicate blocks (⌘D)").disabled).toBe(false)
    pressKey(document.body, "Escape")
    await flush()

    iframe.remove()
  })

  it("moves the whole multi-selection by dragging one member in the live preview", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
        <div data-canvas-block-index="2"><span>third</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    // Deterministic geometry: 12 × 40px columns and 32px base rows
    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    const blockAt = (index: number) =>
      previewDocument.querySelector<HTMLElement>(
        `[data-canvas-block-index="${index}"]`,
      )!
    // The placed members carry the custom properties the Canvas renderer
    // would emit, so restore-on-cancel has real values to put back
    blockAt(0).style.setProperty("--canvas-grid-column", "2 / span 3")
    blockAt(0).style.setProperty("--canvas-grid-row", "2 / span 1")
    blockAt(1).style.setProperty("--canvas-grid-column", "1 / span 4")
    blockAt(1).style.setProperty("--canvas-grid-row", "1 / span 2")

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 3, rowStart: 2, rowSpan: 1 },
          },
          {
            type: "blockquote",
            quote: "The second quote",
            source: "s2",
            placement: { colStart: 1, colSpan: 4, rowStart: 1, rowSpan: 2 },
          },
          { type: "blockquote", quote: "The third quote", source: "s3" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }
    const shiftClick = (block: HTMLElement) => {
      act(() => {
        block.dispatchEvent(
          new iframeRealm.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
        block.dispatchEvent(
          new iframeRealm.MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
      })
    }
    const pressBlock = (block: HTMLElement, clientX: number, clientY: number) =>
      act(() => {
        block.dispatchEvent(
          new iframeRealm.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            clientX,
            clientY,
          }),
        )
      })
    const movePointer = (clientX: number, clientY: number) =>
      act(() => {
        iframe.contentWindow!.dispatchEvent(
          new iframeRealm.MouseEvent("mousemove", { clientX, clientY }),
        )
      })
    const releasePointer = () =>
      act(() => {
        iframe.contentWindow!.dispatchEvent(
          new iframeRealm.MouseEvent("mouseup"),
        )
      })
    const clickBlock = (block: HTMLElement, clientX: number, clientY: number) =>
      act(() => {
        block.dispatchEvent(
          new iframeRealm.MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            clientX,
            clientY,
          }),
        )
      })
    const gridColumnOf = (index: number) =>
      blockAt(index).style.getPropertyValue("--canvas-grid-column")
    const gridRowOf = (index: number) =>
      blockAt(index).style.getPropertyValue("--canvas-grid-row")
    const placementAt = (index: number) => {
      const latest = changes.at(-1) as
        | { blocks?: { placement?: Record<string, number> }[] }
        | undefined
      return latest?.blocks?.[index]?.placement
    }
    const overlay = () =>
      previewDocument.querySelector("[data-canvas-grid-overlay]")
    const badge = () =>
      previewDocument.querySelector("[data-canvas-drag-badge]")

    await flush()
    shiftClick(blockAt(0))
    shiftClick(blockAt(1))
    shiftClick(blockAt(2))
    const baselineChangeCount = changes.length

    // A plain press on a member grabs the whole group instead of dropping
    // the set: no editor opens, nothing commits, and no feedback shows until
    // the pointer actually crosses into another grid cell
    pressBlock(blockAt(0), 85, 40) // cell (row 2, col 3), inside the block
    expect(container.textContent).not.toContain("Edit Canvas blocks")
    expect(blockAt(0).style.outline).toContain("solid")
    expect(blockAt(1).style.outline).toContain("solid")
    expect(overlay()).toBeNull()

    // Crossing cells moves every placed member live by the same delta, with
    // the grid overlay up and a badge naming the grabbed member's live area;
    // the unplaced member stays in the stacked flow
    movePointer(165, 72) // cell (row 3, col 5): delta +2 columns, +1 row
    expect(overlay()).not.toBeNull()
    expect(gridColumnOf(0)).toBe("4 / span 3")
    expect(gridRowOf(0)).toBe("3 / span 1")
    expect(gridColumnOf(1)).toBe("3 / span 4")
    expect(gridRowOf(1)).toBe("2 / span 2")
    expect(gridColumnOf(2)).toBe("")
    expect(badge()?.textContent).toBe("Columns 4–6, rows 3–3")

    // The group clamps as a unit: one member already sits on column 1 and
    // row 1, so dragging up-left past the grid edge moves nothing
    movePointer(5, 8) // cell (row 1, col 1): raw delta -2 columns, -1 row
    expect(gridColumnOf(0)).toBe("2 / span 3")
    expect(gridRowOf(0)).toBe("2 / span 1")
    expect(gridColumnOf(1)).toBe("1 / span 4")
    expect(gridRowOf(1)).toBe("1 / span 2")

    // Releasing commits every placed member's shifted placement in ONE data
    // change, keeping the multi-selection (and its highlight) intact
    movePointer(165, 72)
    releasePointer()
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 1)
    expect(placementAt(0)).toEqual({
      colStart: 4,
      colSpan: 3,
      rowStart: 3,
      rowSpan: 1,
    })
    expect(placementAt(1)).toEqual({
      colStart: 3,
      colSpan: 4,
      rowStart: 2,
      rowSpan: 2,
    })
    expect(placementAt(2)).toBeUndefined()
    expect(overlay()).toBeNull()
    expect(container.textContent).not.toContain("Edit Canvas blocks")
    expect(blockAt(0).style.outline).toContain("solid")
    expect(blockAt(1).style.outline).toContain("solid")
    expect(blockAt(2).style.outline).toContain("solid")

    // The click that ends the drag must not open the dragged block's editor
    clickBlock(blockAt(0), 165, 72)
    await flush()
    expect(container.textContent).not.toContain("Edit Canvas blocks")
    expect(blockAt(0).style.outline).toContain("solid")

    // Escape cancels an in-progress group drag: the members return to their
    // pre-drag positions, nothing commits, and the selection survives the
    // release and its trailing click
    pressBlock(blockAt(0), 165, 72) // cell (row 3, col 5), inside the block
    movePointer(205, 104) // cell (row 4, col 6): delta +1 column, +1 row
    expect(gridColumnOf(0)).toBe("5 / span 3")
    expect(gridRowOf(1)).toBe("3 / span 2")
    pressKey(document.body, "Escape")
    expect(gridColumnOf(0)).toBe("4 / span 3")
    expect(gridRowOf(0)).toBe("3 / span 1")
    expect(gridColumnOf(1)).toBe("3 / span 4")
    expect(gridRowOf(1)).toBe("2 / span 2")
    expect(blockAt(0).style.outline).toContain("solid")
    releasePointer()
    clickBlock(blockAt(0), 205, 104)
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 1)
    expect(container.textContent).not.toContain("Edit Canvas blocks")
    expect(blockAt(0).style.outline).toContain("solid")

    // A press released without crossing cells is a plain click: it commits
    // nothing and opens that block's editor, dropping the multi-selection
    pressBlock(blockAt(0), 165, 72)
    releasePointer()
    clickBlock(blockAt(0), 165, 72)
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 1)
    expect(container.textContent).toContain("Edit Canvas blocks")
    expect(container.textContent).toContain("A quote inside the canvas")
    expect(blockAt(1).style.outline).toBe("")
    expect(blockAt(2).style.outline).toBe("")

    iframe.remove()
  })

  it("shows alignment guides while a group drag lines the group's bounding box up with another block", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
        <div data-canvas-block-index="2"><span>third</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    // Deterministic geometry: 12 × 40px columns and 32px base rows
    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    const blockAt = (index: number) =>
      previewDocument.querySelector<HTMLElement>(
        `[data-canvas-block-index="${index}"]`,
      )!

    // The group's bounding box spans columns 2–5 and rows 2–3 (grid lines
    // 2/6 and 2/4); the non-member sibling occupies columns 7–8 and rows
    // 5–6, so its edges sit on column lines 7/9 and row lines 5/7
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 2, rowStart: 2, rowSpan: 1 },
          },
          {
            type: "blockquote",
            quote: "The second quote",
            source: "s2",
            placement: { colStart: 4, colSpan: 2, rowStart: 3, rowSpan: 1 },
          },
          {
            type: "blockquote",
            quote: "The third quote",
            source: "s3",
            placement: { colStart: 7, colSpan: 2, rowStart: 5, rowSpan: 2 },
          },
        ],
      } as IsomerComponent,
      () => undefined,
    )
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }
    const shiftClick = (block: HTMLElement) => {
      act(() => {
        block.dispatchEvent(
          new iframeRealm.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
        block.dispatchEvent(
          new iframeRealm.MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
      })
    }
    const pressBlock = (block: HTMLElement, clientX: number, clientY: number) =>
      act(() => {
        block.dispatchEvent(
          new iframeRealm.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            clientX,
            clientY,
          }),
        )
      })
    const movePointer = (clientX: number, clientY: number) =>
      act(() => {
        iframe.contentWindow!.dispatchEvent(
          new iframeRealm.MouseEvent("mousemove", { clientX, clientY }),
        )
      })
    const releasePointer = () =>
      act(() => {
        iframe.contentWindow!.dispatchEvent(
          new iframeRealm.MouseEvent("mouseup"),
        )
      })
    const guides = () =>
      previewDocument.querySelector("[data-canvas-alignment-guides]")
    const guideLines = () => {
      const lines = Array.from(guides()?.children ?? []) as HTMLElement[]
      return {
        vertical: lines.filter((line) => line.style.height === "100%"),
        horizontal: lines.filter((line) => line.style.height !== "100%"),
      }
    }

    await flush()
    shiftClick(blockAt(0))
    shiftClick(blockAt(1))

    // Grabbing a member shows nothing until the pointer crosses cells
    pressBlock(blockAt(0), 60, 48) // cell (row 2, col 2)
    expect(guides()).toBeNull()

    // Delta +1/+1 puts the box's right edge on the sibling's left column
    // line (7) and its bottom edge on the sibling's top row line (5)
    movePointer(100, 80) // cell (row 3, col 3)
    expect(guides()).not.toBeNull()
    expect(guideLines().vertical.map((line) => line.style.left)).toEqual([
      "239px",
    ])
    expect(guideLines().horizontal.map((line) => line.style.top)).toEqual([
      "127px",
    ])

    // Delta +2/+2 shares no grid line with the sibling and leaves the box
    // off-centre: the guides disappear
    movePointer(140, 112) // cell (row 4, col 4)
    expect(guides()).toBeNull()

    // Delta +3/+3 aligns the box's right edge with the sibling's right
    // column line (9), both row edges (lines 5 and 7), AND balances the
    // column margins (4 and 4), adding the canvas-centre line (7)
    movePointer(180, 144) // cell (row 5, col 5)
    expect(guideLines().vertical.map((line) => line.style.left)).toEqual([
      "239px",
      "319px",
    ])
    expect(guideLines().horizontal.map((line) => line.style.top)).toEqual([
      "127px",
      "191px",
    ])

    // Cancelling the drag removes the guides
    pressKey(document.body, "Escape")
    expect(guides()).toBeNull()
    releasePointer()

    // Releasing an aligned drag also removes the guides
    pressBlock(blockAt(0), 60, 48)
    movePointer(100, 80)
    expect(guides()).not.toBeNull()
    releasePointer()
    await flush()
    expect(guides()).toBeNull()

    iframe.remove()
  })

  it("leaves copies of the placed multi-selected blocks in place when Alt is held while group-dragging", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
        <div data-canvas-block-index="2"><span>third</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    // Deterministic geometry: 12 × 40px columns and 32px base rows
    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    const blockAt = (index: number) =>
      previewDocument.querySelector<HTMLElement>(
        `[data-canvas-block-index="${index}"]`,
      )!
    blockAt(0).style.setProperty("--canvas-grid-column", "2 / span 3")
    blockAt(0).style.setProperty("--canvas-grid-row", "2 / span 1")
    blockAt(1).style.setProperty("--canvas-grid-column", "1 / span 4")
    blockAt(1).style.setProperty("--canvas-grid-row", "1 / span 2")

    const FIRST_PLACEMENT = { colStart: 2, colSpan: 3, rowStart: 2, rowSpan: 1 }
    const SECOND_PLACEMENT = {
      colStart: 1,
      colSpan: 4,
      rowStart: 1,
      rowSpan: 2,
    }
    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          { ...BLOCKQUOTE_BLOCK, placement: FIRST_PLACEMENT },
          {
            type: "blockquote",
            quote: "The second quote",
            source: "s2",
            placement: SECOND_PLACEMENT,
          },
          { type: "blockquote", quote: "The third quote", source: "s3" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }
    const shiftClick = (block: HTMLElement) => {
      act(() => {
        block.dispatchEvent(
          new iframeRealm.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
        block.dispatchEvent(
          new iframeRealm.MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
      })
    }
    const gridColumnOf = (index: number) =>
      blockAt(index).style.getPropertyValue("--canvas-grid-column")
    const gridRowOf = (index: number) =>
      blockAt(index).style.getPropertyValue("--canvas-grid-row")
    const latestBlocks = () => {
      const latest = changes.at(-1) as
        | { blocks?: { placement?: Record<string, number> }[] }
        | undefined
      return latest?.blocks
    }

    await flush()
    shiftClick(blockAt(0))
    shiftClick(blockAt(1))
    shiftClick(blockAt(2))
    const baselineChangeCount = changes.length

    // Alt-pressing a member of the multi-selection leaves a copy of EVERY
    // placed member in place in ONE data change — appended at the end in
    // stacking order with their exact placements, the unplaced member
    // excluded — while the same press grabs the group for the usual drag
    act(() => {
      blockAt(0).dispatchEvent(
        new iframeRealm.MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          altKey: true,
          clientX: 85,
          clientY: 40, // cell (row 2, col 3), inside the first block
        }),
      )
    })
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 1)
    let blocks = latestBlocks()
    expect(blocks).toHaveLength(5)
    expect(blocks?.[3]).toEqual({
      ...BLOCKQUOTE_BLOCK,
      placement: FIRST_PLACEMENT,
    })
    expect(blocks?.[4]).toEqual({
      type: "blockquote",
      quote: "The second quote",
      source: "s2",
      placement: SECOND_PLACEMENT,
    })
    expect(container.textContent).not.toContain("Edit Canvas blocks")

    // The drag moves the ORIGINAL members live while the copies stay behind
    act(() => {
      iframe.contentWindow!.dispatchEvent(
        new iframeRealm.MouseEvent("mousemove", { clientX: 165, clientY: 72 }),
      )
    })
    expect(gridColumnOf(0)).toBe("4 / span 3")
    expect(gridRowOf(0)).toBe("3 / span 1")
    expect(gridColumnOf(1)).toBe("3 / span 4")
    expect(gridRowOf(1)).toBe("2 / span 2")

    // Releasing commits the originals' shifted placements in one more data
    // change; the copies keep the pre-drag placements and the selection (and
    // its highlight) stays on the originals
    act(() => {
      iframe.contentWindow!.dispatchEvent(new iframeRealm.MouseEvent("mouseup"))
    })
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 2)
    blocks = latestBlocks()
    expect(blocks).toHaveLength(5)
    expect(blocks?.[0]?.placement).toEqual({
      colStart: 4,
      colSpan: 3,
      rowStart: 3,
      rowSpan: 1,
    })
    expect(blocks?.[1]?.placement).toEqual({
      colStart: 3,
      colSpan: 4,
      rowStart: 2,
      rowSpan: 2,
    })
    expect(blocks?.[2]?.placement).toBeUndefined()
    expect(blocks?.[3]?.placement).toEqual(FIRST_PLACEMENT)
    expect(blocks?.[4]?.placement).toEqual(SECOND_PLACEMENT)
    expect(blockAt(0).style.outline).toContain("solid")
    expect(blockAt(1).style.outline).toContain("solid")
    expect(blockAt(2).style.outline).toContain("solid")
    expect(container.textContent).not.toContain("Edit Canvas blocks")

    iframe.remove()
  })

  it("multi-selects blocks by sweeping a rubber-band marquee on the canvas background", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
        <div data-canvas-block-index="2"><span>third</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    // Deterministic geometry: 12 × 40px columns and 32px base rows
    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    const blockAt = (index: number) =>
      previewDocument.querySelector<HTMLElement>(
        `[data-canvas-block-index="${index}"]`,
      )!
    // The marquee selects what it visibly touches, so the blocks carry the
    // rects the 480×320 canvas would give their placements; the unplaced
    // third block sits in the stacked flow below the placed two
    const mockRect = (
      element: HTMLElement,
      left: number,
      top: number,
      right: number,
      bottom: number,
    ) => {
      element.getBoundingClientRect = () => ({
        left,
        top,
        right,
        bottom,
        width: right - left,
        height: bottom - top,
        x: left,
        y: top,
        toJSON: () => ({}),
      })
    }
    mockRect(blockAt(0), 40, 32, 160, 64)
    mockRect(blockAt(1), 0, 0, 160, 64)
    mockRect(blockAt(2), 0, 250, 480, 282)

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 3, rowStart: 2, rowSpan: 1 },
          },
          {
            type: "blockquote",
            quote: "The second quote",
            source: "s2",
            placement: { colStart: 1, colSpan: 4, rowStart: 1, rowSpan: 2 },
          },
          { type: "blockquote", quote: "The third quote", source: "s3" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }
    const pressBackground = (clientX: number, clientY: number) =>
      act(() => {
        previewCanvas.dispatchEvent(
          new iframeRealm.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            clientX,
            clientY,
          }),
        )
      })
    const movePointer = (clientX: number, clientY: number) =>
      act(() => {
        iframe.contentWindow!.dispatchEvent(
          new iframeRealm.MouseEvent("mousemove", { clientX, clientY }),
        )
      })
    const releasePointer = () =>
      act(() => {
        iframe.contentWindow!.dispatchEvent(
          new iframeRealm.MouseEvent("mouseup"),
        )
      })
    const clickBackground = (clientX: number, clientY: number) =>
      act(() => {
        previewCanvas.dispatchEvent(
          new iframeRealm.MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            clientX,
            clientY,
          }),
        )
      })
    const marqueeRectangle = () =>
      previewDocument.querySelector<HTMLElement>("[data-canvas-marquee]")

    await flush()
    const baselineChangeCount = changes.length

    // A background press alone shows nothing, and neither does a
    // sub-threshold jiggle — that press stays a plain click
    pressBackground(350, 100)
    expect(marqueeRectangle()).toBeNull()
    movePointer(352, 102)
    expect(marqueeRectangle()).toBeNull()

    // Travelling past the threshold draws the rectangle between the press
    // point and the pointer
    movePointer(30, 20)
    const rectangle = marqueeRectangle()
    expect(rectangle).not.toBeNull()
    expect(rectangle!.style.left).toBe("30px")
    expect(rectangle!.style.top).toBe("20px")
    expect(rectangle!.style.width).toBe("320px")
    expect(rectangle!.style.height).toBe("80px")

    // Releasing selects every block the sweep touched: both placed blocks
    // light up as the multi-selection, the stacked block outside the
    // rectangle does not, no editor opens, and nothing commits
    releasePointer()
    await flush()
    expect(marqueeRectangle()).toBeNull()
    expect(blockAt(0).style.outline).toContain("solid")
    expect(blockAt(1).style.outline).toContain("solid")
    expect(blockAt(2).style.outline).toBe("")
    expect(container.textContent).not.toContain("Edit Canvas blocks")
    expect(changes.length).toBe(baselineChangeCount)

    // The click trailing the sweep lands on the background but must not
    // clear the selection the sweep just produced
    clickBackground(30, 20)
    await flush()
    expect(blockAt(0).style.outline).toContain("solid")
    expect(blockAt(1).style.outline).toContain("solid")

    // Escape cancels an in-progress sweep: the rectangle disappears and the
    // existing selection survives the release and its trailing click
    pressBackground(400, 290)
    movePointer(470, 310)
    expect(marqueeRectangle()).not.toBeNull()
    pressKey(document.body, "Escape")
    expect(marqueeRectangle()).toBeNull()
    releasePointer()
    clickBackground(470, 310)
    await flush()
    expect(blockAt(0).style.outline).toContain("solid")
    expect(blockAt(1).style.outline).toContain("solid")

    // Sweeping only empty canvas deselects, like a plain background click
    pressBackground(400, 290)
    movePointer(470, 310)
    releasePointer()
    await flush()
    expect(blockAt(0).style.outline).toBe("")
    expect(blockAt(1).style.outline).toBe("")
    expect(changes.length).toBe(baselineChangeCount)

    // The swept set is a real multi-selection: Delete removes every member
    // in one keystroke and one data change
    pressBackground(350, 100)
    movePointer(30, 20)
    releasePointer()
    await flush()
    pressKey(document.body, "Delete")
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 1)
    const afterDelete = changes.at(-1) as
      | { blocks?: { quote?: string }[] }
      | undefined
    expect(afterDelete?.blocks).toHaveLength(1)
    expect(afterDelete?.blocks?.[0]?.quote).toBe("The third quote")

    iframe.remove()
  })

  it("adds marquee-swept blocks to the existing multi-selection when Shift is held", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
        <div data-canvas-block-index="2"><span>third</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    // Deterministic geometry: 12 × 40px columns and 32px base rows
    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    const blockAt = (index: number) =>
      previewDocument.querySelector<HTMLElement>(
        `[data-canvas-block-index="${index}"]`,
      )!
    const mockRect = (
      element: HTMLElement,
      left: number,
      top: number,
      right: number,
      bottom: number,
    ) => {
      element.getBoundingClientRect = () => ({
        left,
        top,
        right,
        bottom,
        width: right - left,
        height: bottom - top,
        x: left,
        y: top,
        toJSON: () => ({}),
      })
    }
    mockRect(blockAt(0), 40, 32, 160, 64)
    mockRect(blockAt(1), 0, 0, 160, 64)
    mockRect(blockAt(2), 0, 250, 480, 282)

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 3, rowStart: 2, rowSpan: 1 },
          },
          {
            type: "blockquote",
            quote: "The second quote",
            source: "s2",
            placement: { colStart: 1, colSpan: 4, rowStart: 1, rowSpan: 2 },
          },
          { type: "blockquote", quote: "The third quote", source: "s3" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }
    const pressBackground = (clientX: number, clientY: number) =>
      act(() => {
        previewCanvas.dispatchEvent(
          new iframeRealm.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            clientX,
            clientY,
            shiftKey: true,
          }),
        )
      })
    const movePointer = (clientX: number, clientY: number) =>
      act(() => {
        iframe.contentWindow!.dispatchEvent(
          new iframeRealm.MouseEvent("mousemove", {
            clientX,
            clientY,
            shiftKey: true,
          }),
        )
      })
    const releasePointer = () =>
      act(() => {
        iframe.contentWindow!.dispatchEvent(
          new iframeRealm.MouseEvent("mouseup", { shiftKey: true }),
        )
      })
    const clickBackground = (clientX: number, clientY: number) =>
      act(() => {
        previewCanvas.dispatchEvent(
          new iframeRealm.MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            clientX,
            clientY,
            shiftKey: true,
          }),
        )
      })
    const shiftClick = (block: HTMLElement) => {
      act(() => {
        block.dispatchEvent(
          new iframeRealm.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
        block.dispatchEvent(
          new iframeRealm.MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
      })
    }
    const marqueeRectangle = () =>
      previewDocument.querySelector<HTMLElement>("[data-canvas-marquee]")

    await flush()
    const baselineChangeCount = changes.length

    // Seed a multi-selection with the first block, then sweep an additive
    // marquee over the stacked third block only
    shiftClick(blockAt(0))
    expect(blockAt(0).style.outline).toContain("solid")

    // A Shift+press on the background sweeps a marquee too
    pressBackground(400, 290)
    expect(marqueeRectangle()).toBeNull()
    movePointer(300, 260)
    const rectangle = marqueeRectangle()
    expect(rectangle).not.toBeNull()
    expect(rectangle!.style.left).toBe("300px")
    expect(rectangle!.style.top).toBe("260px")
    expect(rectangle!.style.width).toBe("100px")
    expect(rectangle!.style.height).toBe("30px")

    // Releasing ADDS the swept block to the existing selection instead of
    // replacing it: both the seeded and the swept block light up, no editor
    // opens, and nothing commits
    releasePointer()
    await flush()
    expect(marqueeRectangle()).toBeNull()
    expect(blockAt(0).style.outline).toContain("solid")
    expect(blockAt(2).style.outline).toContain("solid")
    expect(blockAt(1).style.outline).toBe("")
    expect(container.textContent).not.toContain("Edit Canvas blocks")
    expect(changes.length).toBe(baselineChangeCount)
    clickBackground(300, 260)
    await flush()
    expect(blockAt(0).style.outline).toContain("solid")
    expect(blockAt(2).style.outline).toContain("solid")

    // An additive sweep over empty canvas keeps the selection (a plain
    // sweep over nothing would deselect)
    pressBackground(300, 100)
    movePointer(470, 150)
    releasePointer()
    await flush()
    expect(blockAt(0).style.outline).toContain("solid")
    expect(blockAt(2).style.outline).toContain("solid")

    // With a block's editor open, an additive sweep seeds the set with the
    // edited block — same as the Shift+click toggle — and closes the editor
    pressKey(document.body, "Escape")
    expect(blockAt(0).style.outline).toBe("")
    click(findButtonByText("Item 2")!)
    expect(container.textContent).toContain("Edit Canvas blocks")
    await flush()
    pressBackground(400, 290)
    movePointer(300, 260)
    releasePointer()
    await flush()
    expect(container.textContent).not.toContain("Edit Canvas blocks")
    expect(blockAt(1).style.outline).toContain("solid")
    expect(blockAt(2).style.outline).toContain("solid")
    expect(blockAt(0).style.outline).toBe("")

    // The grown set is a real multi-selection: Delete removes both members
    // in one data change, leaving only the never-swept first block
    pressKey(document.body, "Delete")
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 1)
    const afterDelete = changes.at(-1) as
      | { blocks?: { quote?: string }[] }
      | undefined
    expect(afterDelete?.blocks).toHaveLength(1)
    expect(afterDelete?.blocks?.[0]?.quote).toBe("A quote inside the canvas")

    iframe.remove()
  })

  it("copies, cuts, and pastes the multi-selected blocks as a group", async () => {
    resetCanvasBlockClipboard()
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    // More preview block elements than data blocks, so the highlight on the
    // copies appended by each group paste has elements to land on
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
        <div data-canvas-block-index="2"><span>third</span></div>
        <div data-canvas-block-index="3"><span>fourth</span></div>
        <div data-canvas-block-index="4"><span>fifth</span></div>
        <div data-canvas-block-index="5"><span>sixth</span></div>
        <div data-canvas-block-index="6"><span>seventh</span></div>
        <div data-canvas-block-index="7"><span>eighth</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    // 480px content box over 12 columns (empty computed styles read as zero
    // gaps/padding/borders in jsdom) puts a column every 40px and a base row
    // every 32px — the background "paste here" needs a resolvable grid cell
    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 3, rowStart: 1, rowSpan: 1 },
          },
          {
            type: "blockquote",
            quote: "The second quote",
            source: "s2",
            placement: { colStart: 7, colSpan: 4, rowStart: 2, rowSpan: 2 },
          },
          { type: "blockquote", quote: "The third quote", source: "s3" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }

    const blockAt = (index: number) =>
      previewDocument.querySelector<HTMLElement>(
        `[data-canvas-block-index="${index}"]`,
      )!
    const shiftClick = (block: HTMLElement) => {
      act(() => {
        block.dispatchEvent(
          new iframeRealm.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
        block.dispatchEvent(
          new iframeRealm.MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
      })
    }
    const menuItem = (label: string) => {
      const item = Array.from(
        previewDocument.querySelectorAll<HTMLButtonElement>(
          "[data-canvas-context-menu] button",
        ),
      ).find((button) => button.textContent === label)
      expect(item).not.toBeUndefined()
      return item!
    }
    const rightClick = (
      element: Element,
      coords: Pick<MouseEventInit, "clientX" | "clientY">,
    ) => {
      act(() => {
        element.dispatchEvent(
          new iframeRealm.MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
            ...coords,
          }),
        )
      })
    }
    const latestBlocks = () => {
      const latest = changes.at(-1) as
        | {
            blocks?: {
              quote?: string
              placement?: Record<string, number>
            }[]
          }
        | undefined
      return latest?.blocks
    }

    await flush()
    shiftClick(blockAt(0))
    shiftClick(blockAt(1))
    const baselineChangeCount = changes.length

    // ⌘C snapshots the multi-selection into the block clipboard without
    // touching the data, keeping the selection intact
    pressKey(document.body, "c", { metaKey: true })
    await flush()
    expect(changes.length).toBe(baselineChangeCount)
    expect(blockAt(0).style.outline).toContain("solid")
    expect(blockAt(1).style.outline).toContain("solid")

    // ⌘V pastes the whole group in ONE data change: each copy lands one row
    // below its source (the unselected third block is untouched), no block
    // editor opens, and the selection moves to the pasted copies
    pressKey(document.body, "v", { metaKey: true })
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 1)
    expect(latestBlocks()).toHaveLength(5)
    expect(latestBlocks()?.[3]?.quote).toBe(BLOCKQUOTE_BLOCK.quote)
    expect(latestBlocks()?.[3]?.placement).toEqual({
      colStart: 2,
      colSpan: 3,
      rowStart: 2,
      rowSpan: 1,
    })
    expect(latestBlocks()?.[4]?.quote).toBe("The second quote")
    expect(latestBlocks()?.[4]?.placement).toEqual({
      colStart: 7,
      colSpan: 4,
      rowStart: 3,
      rowSpan: 2,
    })
    expect(container.textContent).not.toContain("Edit Canvas blocks")
    expect(blockAt(0).style.outline).toBe("")
    expect(blockAt(1).style.outline).toBe("")
    expect(blockAt(3).style.outline).toContain("solid")
    expect(blockAt(4).style.outline).toContain("solid")

    // Pasting again cascades the group one more row down instead of stacking
    pressKey(document.body, "v", { metaKey: true })
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 2)
    expect(latestBlocks()).toHaveLength(7)
    expect(latestBlocks()?.[5]?.placement?.rowStart).toBe(3)
    expect(latestBlocks()?.[6]?.placement?.rowStart).toBe(4)
    expect(blockAt(5).style.outline).toContain("solid")
    expect(blockAt(6).style.outline).toContain("solid")

    // The group context menu offers the same clipboard commands: Cut blocks
    // removes every member in ONE data change, leaving the cut pair in the
    // clipboard
    rightClick(blockAt(5).querySelector("span")!, { clientX: 60, clientY: 40 })
    await flush()
    expect(menuItem("Copy blocks (⌘C)").disabled).toBe(false)
    expect(menuItem("Paste blocks (⌘V)").disabled).toBe(false)
    act(() => {
      menuItem("Cut blocks (⌘X)").click()
    })
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 3)
    expect(latestBlocks()).toHaveLength(5)
    expect(blockAt(5).style.outline).toBe("")
    expect(blockAt(6).style.outline).toBe("")

    // "Paste block here" with a group clipboard keeps the members' relative
    // layout: the group's top-left corner lands on the right-clicked cell
    // (clientX 330 → column 9, clientY 10 → row 1), clamped as a unit so the
    // wider member stays on the grid (column delta clamps to +2), and the
    // selection lands on the pasted copies
    rightClick(previewCanvas, { clientX: 330, clientY: 10 })
    await flush()
    act(() => {
      menuItem("Paste block here").click()
    })
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 4)
    expect(latestBlocks()).toHaveLength(7)
    expect(latestBlocks()?.[5]?.quote).toBe(BLOCKQUOTE_BLOCK.quote)
    expect(latestBlocks()?.[5]?.placement).toEqual({
      colStart: 4,
      colSpan: 3,
      rowStart: 1,
      rowSpan: 1,
    })
    expect(latestBlocks()?.[6]?.quote).toBe("The second quote")
    expect(latestBlocks()?.[6]?.placement).toEqual({
      colStart: 9,
      colSpan: 4,
      rowStart: 2,
      rowSpan: 2,
    })
    expect(container.textContent).not.toContain("Edit Canvas blocks")
    expect(blockAt(5).style.outline).toContain("solid")
    expect(blockAt(6).style.outline).toContain("solid")

    iframe.remove()
  })

  it("moves the multi-selection to the front and back of the stack together", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
        <div data-canvas-block-index="2"><span>third</span></div>
        <div data-canvas-block-index="3"><span>fourth</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          {
            ...BLOCKQUOTE_BLOCK,
            placement: { colStart: 2, colSpan: 3, rowStart: 1, rowSpan: 1 },
          },
          { type: "blockquote", quote: "The second quote", source: "s2" },
          { type: "blockquote", quote: "The third quote", source: "s3" },
          { type: "blockquote", quote: "The fourth quote", source: "s4" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }

    const blockAt = (index: number) =>
      previewDocument.querySelector<HTMLElement>(
        `[data-canvas-block-index="${index}"]`,
      )!
    const shiftClick = (block: HTMLElement) => {
      act(() => {
        block.dispatchEvent(
          new iframeRealm.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
        block.dispatchEvent(
          new iframeRealm.MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
      })
    }
    const menuItem = (label: string) => {
      const item = Array.from(
        previewDocument.querySelectorAll<HTMLButtonElement>(
          "[data-canvas-context-menu] button",
        ),
      ).find((button) => button.textContent === label)
      expect(item).not.toBeUndefined()
      return item!
    }
    const rightClick = (element: Element) => {
      act(() => {
        element.dispatchEvent(
          new iframeRealm.MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
            clientX: 60,
            clientY: 40,
          }),
        )
      })
    }
    const latestBlocks = () => {
      const latest = changes.at(-1) as
        | {
            blocks?: {
              quote?: string
              placement?: Record<string, number>
            }[]
          }
        | undefined
      return latest?.blocks
    }
    const lastQuotes = () => latestBlocks()?.map((block) => block.quote)

    await flush()
    shiftClick(blockAt(0))
    shiftClick(blockAt(2))
    const baselineChangeCount = changes.length

    // ⌘⇧] brings every member of the multi-selection to the front of the
    // stack in ONE data change, keeping the members' relative order and the
    // other blocks' relative order intact — placements travel with the
    // moved blocks, and the selection (with its highlight) follows them
    pressKey(document.body, "}", { metaKey: true, shiftKey: true })
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 1)
    expect(lastQuotes()).toEqual([
      "The second quote",
      "The fourth quote",
      "A quote inside the canvas",
      "The third quote",
    ])
    expect(latestBlocks()?.[2]?.placement).toEqual({
      colStart: 2,
      colSpan: 3,
      rowStart: 1,
      rowSpan: 1,
    })
    expect(blockAt(0).style.outline).toBe("")
    expect(blockAt(1).style.outline).toBe("")
    expect(blockAt(2).style.outline).toContain("solid")
    expect(blockAt(3).style.outline).toContain("solid")

    // A second ⌘⇧] commits nothing — the group already sits at the front
    pressKey(document.body, "}", { metaKey: true, shiftKey: true })
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 1)

    // ⌘⇧[ sends the group to the back of the stack in one data change
    pressKey(document.body, "{", { metaKey: true, shiftKey: true })
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 2)
    expect(lastQuotes()).toEqual([
      "A quote inside the canvas",
      "The third quote",
      "The second quote",
      "The fourth quote",
    ])
    expect(blockAt(0).style.outline).toContain("solid")
    expect(blockAt(1).style.outline).toContain("solid")
    expect(blockAt(2).style.outline).toBe("")
    expect(blockAt(3).style.outline).toBe("")

    // The group context menu offers the same commands: Send to back is
    // disabled while the group sits at the back, and Bring to front commits
    // the reorder with the selection following the members
    rightClick(blockAt(0).querySelector("span")!)
    await flush()
    expect(menuItem("Send to back (⌘⇧[)").disabled).toBe(true)
    expect(menuItem("Bring to front (⌘⇧])").disabled).toBe(false)
    act(() => {
      menuItem("Bring to front (⌘⇧])").click()
    })
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 3)
    expect(lastQuotes()).toEqual([
      "The second quote",
      "The fourth quote",
      "A quote inside the canvas",
      "The third quote",
    ])
    expect(blockAt(2).style.outline).toContain("solid")
    expect(blockAt(3).style.outline).toContain("solid")

    iframe.remove()
  })

  it("selects every canvas block into the multi-selection with ⌘A", async () => {
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
        <div data-canvas-block-index="2"><span>third</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          BLOCKQUOTE_BLOCK,
          { type: "blockquote", quote: "The second quote", source: "s2" },
          { type: "blockquote", quote: "The third quote", source: "s3" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }

    const blockAt = (index: number) =>
      previewDocument.querySelector<HTMLElement>(
        `[data-canvas-block-index="${index}"]`,
      )!
    const shiftClick = (block: HTMLElement) => {
      act(() => {
        block.dispatchEvent(
          new iframeRealm.MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
        block.dispatchEvent(
          new iframeRealm.MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            shiftKey: true,
          }),
        )
      })
    }
    // Dispatched manually (not via pressKey) so the browser-shortcut
    // takeover is observable through defaultPrevented
    const pressSelectAll = (target: Element) => {
      const event = new KeyboardEvent("keydown", {
        key: "a",
        metaKey: true,
        bubbles: true,
        cancelable: true,
      })
      act(() => {
        target.dispatchEvent(event)
      })
      return event
    }

    await flush()
    const baselineChangeCount = changes.length

    // ⌘A from the block list view gathers every block into the
    // multi-selection, consuming the keystroke so the browser's text
    // select-all never fires — no editor opens and no data changes
    expect(pressSelectAll(document.body).defaultPrevented).toBe(true)
    expect(container.textContent).not.toContain("Edit Canvas blocks")
    expect(blockAt(0).style.outline).toContain("solid")
    expect(blockAt(1).style.outline).toContain("solid")
    expect(blockAt(2).style.outline).toContain("solid")
    expect(changes.length).toBe(baselineChangeCount)

    // ⌘A from a partial multi-selection grows it to every block
    pressKey(document.body, "Escape")
    shiftClick(blockAt(1))
    expect(blockAt(0).style.outline).toBe("")
    pressSelectAll(document.body)
    expect(blockAt(0).style.outline).toContain("solid")
    expect(blockAt(1).style.outline).toContain("solid")
    expect(blockAt(2).style.outline).toContain("solid")
    pressKey(document.body, "Escape")

    // With a block's editor open, ⌘A aimed at a form field keeps its native
    // select-the-field-text meaning
    click(findButtonByText("Item 1")!)
    expect(container.textContent).toContain("Edit Canvas blocks")
    await flush()
    const quoteInput = Array.from(
      container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input, textarea",
      ),
    ).find((field) => field.value === BLOCKQUOTE_BLOCK.quote)
    expect(quoteInput).not.toBeUndefined()
    expect(pressSelectAll(quoteInput!).defaultPrevented).toBe(false)
    expect(container.textContent).toContain("Edit Canvas blocks")
    // The edited block keeps the placement control's own outline; the
    // siblings staying bare proves no multi-selection formed
    expect(blockAt(1).style.outline).toBe("")
    expect(blockAt(2).style.outline).toBe("")

    // ⌘A outside any field closes the editor and selects every block, the
    // edited block seeding the set like the Shift+click toggle
    pressSelectAll(document.body)
    expect(container.textContent).not.toContain("Edit Canvas blocks")
    expect(container.textContent).toContain("Add item")
    expect(blockAt(0).style.outline).toContain("solid")
    expect(blockAt(1).style.outline).toContain("solid")
    expect(blockAt(2).style.outline).toContain("solid")

    // The selection composes with the group actions: Delete removes every
    // block on the canvas in one data change
    pressKey(document.body, "Delete")
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 1)
    const afterDelete = changes.at(-1) as { blocks?: unknown[] } | undefined
    expect(afterDelete?.blocks).toHaveLength(0)
    expect(container.textContent).toContain("Items you add will appear here")

    // With no blocks on the canvas, ⌘A keeps its native meaning
    expect(pressSelectAll(document.body).defaultPrevented).toBe(false)

    iframe.remove()
  })

  it("selects every canvas block via the background context menu's Select all command", async () => {
    resetCanvasBlockClipboard()
    const iframe = document.createElement("iframe")
    document.body.appendChild(iframe)
    const previewDocument = iframe.contentDocument!
    previewDocument.body.innerHTML = `
      <div data-canvas-container="">
        <div data-canvas-block-index="0"><span>first</span></div>
        <div data-canvas-block-index="1"><span>second</span></div>
        <div data-canvas-block-index="2"><span>third</span></div>
      </div>
    `
    const iframeRealm = iframe.contentWindow as unknown as {
      Element: { prototype: { scrollIntoView: () => void } }
      MouseEvent: typeof MouseEvent
    }
    iframeRealm.Element.prototype.scrollIntoView = () => undefined

    // The background menu only opens when a grid cell can be resolved, so
    // the canvas needs measurable geometry (480px content box over 12
    // columns puts a column every 40px and a base row every 32px)
    const previewCanvas = previewDocument.querySelector<HTMLElement>(
      "[data-canvas-container]",
    )!
    previewCanvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    const changes: IsomerComponent[] = []
    renderCanvasFormInEditorDrawer(
      {
        type: "canvas",
        blocks: [
          BLOCKQUOTE_BLOCK,
          { type: "blockquote", quote: "The second quote", source: "s2" },
          { type: "blockquote", quote: "The third quote", source: "s3" },
        ],
      } as IsomerComponent,
      (data) => changes.push(data),
    )
    const menu = () =>
      previewDocument.querySelector<HTMLElement>("[data-canvas-context-menu]")
    const menuItem = (label: string) => {
      const item = Array.from(
        previewDocument.querySelectorAll<HTMLButtonElement>(
          "[data-canvas-context-menu] button",
        ),
      ).find((button) => button.textContent === label)
      expect(item).not.toBeUndefined()
      return item!
    }
    const rightClick = (
      element: Element,
      coords: Pick<MouseEventInit, "clientX" | "clientY">,
    ) => {
      const event = new iframeRealm.MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        ...coords,
      })
      act(() => {
        element.dispatchEvent(event)
      })
      return event
    }
    const flush = async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    }
    const blockAt = (index: number) =>
      previewDocument.querySelector<HTMLElement>(
        `[data-canvas-block-index="${index}"]`,
      )!
    await flush()
    const baselineChangeCount = changes.length

    // The background menu offers Select all blocks; invoking it from list
    // view gathers every block into the multi-selection, closing the menu
    // with no editor opened and no data change
    rightClick(previewCanvas, { clientX: 90, clientY: 70 })
    await flush()
    expect(menuItem("Select all blocks (⌘A)").disabled).toBe(false)
    act(() => {
      menuItem("Select all blocks (⌘A)").click()
    })
    await flush()
    expect(menu()).toBeNull()
    expect(container.textContent).not.toContain("Edit Canvas blocks")
    expect(blockAt(0).style.outline).toContain("solid")
    expect(blockAt(1).style.outline).toContain("solid")
    expect(blockAt(2).style.outline).toContain("solid")
    expect(changes.length).toBe(baselineChangeCount)

    // From an open block editor, the command closes the editor and selects
    // every block, the edited block seeding the set like the ⌘A shortcut
    pressKey(document.body, "Escape")
    expect(blockAt(0).style.outline).toBe("")
    click(findButtonByText("Item 1")!)
    await flush()
    expect(container.textContent).toContain("Edit Canvas blocks")
    rightClick(previewCanvas, { clientX: 90, clientY: 70 })
    await flush()
    act(() => {
      menuItem("Select all blocks (⌘A)").click()
    })
    await flush()
    expect(container.textContent).not.toContain("Edit Canvas blocks")
    expect(container.textContent).toContain("Add item")
    expect(blockAt(0).style.outline).toContain("solid")
    expect(blockAt(1).style.outline).toContain("solid")
    expect(blockAt(2).style.outline).toContain("solid")

    // The menu-driven selection composes with the group actions: Delete
    // removes every block in one data change
    pressKey(document.body, "Delete")
    await flush()
    expect(changes.length).toBe(baselineChangeCount + 1)
    const afterDelete = changes.at(-1) as { blocks?: unknown[] } | undefined
    expect(afterDelete?.blocks).toHaveLength(0)

    // With no blocks left on the canvas, the command is disabled
    rightClick(previewCanvas, { clientX: 90, clientY: 70 })
    await flush()
    expect(menuItem("Select all blocks (⌘A)").disabled).toBe(true)

    iframe.remove()
  })
})
