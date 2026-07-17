// @vitest-environment jsdom
import type { IsomerComponent } from "@opengovsg/isomer-components"
import type { Root } from "react-dom/client"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { getComponentSchema } from "@opengovsg/isomer-components"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
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
})
