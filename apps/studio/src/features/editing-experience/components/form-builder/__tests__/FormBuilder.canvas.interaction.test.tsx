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
import {
  EditorDrawerProvider,
  useEditorDrawerContext,
} from "~/contexts/EditorDrawerContext"
import { theme } from "~/theme"
import { ajv } from "~/utils/ajv"

import { ErrorProvider } from "../ErrorProvider"
import FormBuilder from "../FormBuilder"

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
      }),
    )
  })
  act(() => {
    window.dispatchEvent(new MouseEvent("mouseup"))
  })
}

const pressKey = (element: Element, key: string) => {
  act(() => {
    element.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
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
    canvasSize.width = 600
    canvasSize.height = 500
    act(() => {
      iframe.contentWindow!.dispatchEvent(new iframeRealm.MouseEvent("mouseup"))
    })
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
})
