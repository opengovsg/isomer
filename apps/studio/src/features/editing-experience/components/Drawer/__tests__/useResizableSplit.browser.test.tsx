import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useResizableSplit } from "../useResizableSplit"

const CONTAINER_WIDTH = 1000

const Harness = () => {
  const { containerRef, firstPanePercent, isDragging, separatorProps } =
    useResizableSplit()

  return (
    <div
      ref={containerRef}
      style={{ display: "flex", width: `${CONTAINER_WIDTH}px` }}
    >
      <div
        data-testid="first-pane"
        data-dragging={isDragging}
        style={{ flexBasis: `${firstPanePercent}%` }}
      />
      <div {...separatorProps} />
    </div>
  )
}

const renderSplit = () => {
  render(<Harness />)
  const separator = screen.getByRole("separator", { name: "Resize panes" })
  const left = separator.parentElement!.getBoundingClientRect().left
  return { separator, left }
}

describe("useResizableSplit", () => {
  it("starts with the panes split evenly", () => {
    const { separator } = renderSplit()

    expect(separator.getAttribute("aria-valuenow")).toBe("50")
  })

  it("resizes the panes to follow a drag of the separator", () => {
    const { separator, left } = renderSplit()

    fireEvent.pointerDown(separator, { clientX: left + 500 })
    fireEvent.pointerMove(window, { clientX: left + 300 })
    fireEvent.pointerUp(window)

    expect(separator.getAttribute("aria-valuenow")).toBe("30")
    expect(screen.getByTestId("first-pane").dataset.dragging).toBe("false")
  })

  it("stops resizing once the drag ends", () => {
    const { separator, left } = renderSplit()

    fireEvent.pointerDown(separator, { clientX: left + 500 })
    fireEvent.pointerUp(window)
    fireEvent.pointerMove(window, { clientX: left + 200 })

    expect(separator.getAttribute("aria-valuenow")).toBe("50")
  })

  it("keeps both panes at least 10% wide", () => {
    const { separator, left } = renderSplit()

    fireEvent.pointerDown(separator, { clientX: left + 500 })
    fireEvent.pointerMove(window, { clientX: left - 100 })
    expect(separator.getAttribute("aria-valuenow")).toBe("10")

    fireEvent.pointerMove(window, { clientX: left + CONTAINER_WIDTH + 100 })
    expect(separator.getAttribute("aria-valuenow")).toBe("90")
  })

  it("resizes with the arrow keys", () => {
    const { separator } = renderSplit()

    fireEvent.keyDown(separator, { key: "ArrowLeft" })
    expect(separator.getAttribute("aria-valuenow")).toBe("45")

    fireEvent.keyDown(separator, { key: "ArrowRight" })
    fireEvent.keyDown(separator, { key: "ArrowRight" })
    expect(separator.getAttribute("aria-valuenow")).toBe("55")
  })
})
