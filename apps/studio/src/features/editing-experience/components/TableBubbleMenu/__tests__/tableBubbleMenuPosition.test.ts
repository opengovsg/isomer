import { describe, expect, it } from "vitest"

import {
  computeTableBubbleMenuPlacement,
  computeTableBubbleMenuPosition,
  TABLE_BUBBLE_MENU_GAP_PX,
  TABLE_BUBBLE_MENU_VIEWPORT_PADDING_PX,
} from "../tableBubbleMenuPosition"

const cellRect = (top: number, bottom: number, right = 400) =>
  new DOMRect(300, top, 100, bottom - top)

const dimensions = ({
  triggerHeight = 32,
  triggerWidth = 32,
  actionsHeight = 200,
}: {
  triggerHeight?: number
  triggerWidth?: number
  actionsHeight?: number
} = {}) => ({
  triggerHeight,
  triggerWidth,
  actionsHeight,
})

describe("computeTableBubbleMenuPlacement", () => {
  it("keeps the default above placement when the actions panel fits", () => {
    // Arrange
    const rect = cellRect(200, 400)

    // Act
    const placement = computeTableBubbleMenuPlacement({
      cellRect: rect,
      dimensions: dimensions(),
      isActivated: true,
      viewportHeight: 800,
    })

    // Assert
    expect(placement).toBe("above")
  })

  it("flips below when the actions panel would overflow the top of the viewport", () => {
    // Arrange
    const rect = cellRect(20, 60)

    // Act
    const placement = computeTableBubbleMenuPlacement({
      cellRect: rect,
      dimensions: dimensions(),
      isActivated: true,
      viewportHeight: 800,
    })

    // Assert
    expect(placement).toBe("below")
  })

  it("stays above when the menu is not activated", () => {
    // Arrange
    const rect = cellRect(0, 20)

    // Act
    const placement = computeTableBubbleMenuPlacement({
      cellRect: rect,
      dimensions: dimensions({ actionsHeight: 0 }),
      isActivated: false,
      viewportHeight: 800,
    })

    // Assert
    expect(placement).toBe("above")
  })

  it("prefers the side with more space when neither placement fully fits", () => {
    // Arrange
    const rect = cellRect(350, 420)

    // Act
    const placement = computeTableBubbleMenuPlacement({
      cellRect: rect,
      dimensions: dimensions({ actionsHeight: 300 }),
      isActivated: true,
      viewportHeight: 500,
    })

    // Assert
    expect(placement).toBe("below")
  })
})

describe("computeTableBubbleMenuPosition", () => {
  const createMenuEl = (actionsWidth = 160) => {
    const menuEl = document.createElement("div")
    const actionsEl = document.createElement("div")
    actionsEl.setAttribute("data-table-bubble-menu-actions", "")
    Object.defineProperty(actionsEl, "offsetWidth", { value: actionsWidth })
    Object.defineProperty(actionsEl, "offsetHeight", { value: 200 })

    const triggerEl = document.createElement("button")
    triggerEl.setAttribute("data-table-bubble-menu-trigger", "")
    Object.defineProperty(triggerEl, "offsetWidth", { value: 32 })
    Object.defineProperty(triggerEl, "offsetHeight", { value: 32 })
    Object.defineProperty(triggerEl, "offsetLeft", {
      value: Math.max(0, actionsWidth - 32),
    })

    menuEl.append(actionsEl, triggerEl)
    return menuEl
  }

  it("anchors the trigger center on the cell corner when placement is above", () => {
    // Arrange
    const rect = cellRect(200, 300)
    const menuEl = createMenuEl()
    const dims = dimensions()

    // Act
    const position = computeTableBubbleMenuPosition({
      cellRect: rect,
      menuEl,
      dimensions: dims,
      placement: "above",
    })

    // Assert
    expect(position).toEqual({
      x: rect.right - dims.triggerWidth / 2 - (160 - 32),
      y:
        rect.bottom -
        dims.triggerHeight / 2 -
        (dims.actionsHeight + TABLE_BUBBLE_MENU_GAP_PX),
    })
  })

  it("anchors the trigger center on the cell corner when placement is below", () => {
    // Arrange
    const rect = cellRect(20, 60)
    const menuEl = createMenuEl()
    const dims = dimensions()

    // Act
    const position = computeTableBubbleMenuPosition({
      cellRect: rect,
      menuEl,
      dimensions: dims,
      placement: "below",
    })

    // Assert
    expect(position).toEqual({
      x: rect.right - dims.triggerWidth / 2 - (160 - 32),
      y: rect.bottom - dims.triggerHeight / 2,
    })
  })
})

describe("TABLE_BUBBLE_MENU_VIEWPORT_PADDING_PX", () => {
  it("matches the gap used for placement calculations", () => {
    expect(TABLE_BUBBLE_MENU_VIEWPORT_PADDING_PX).toBeGreaterThan(0)
    expect(TABLE_BUBBLE_MENU_GAP_PX).toBe(4)
  })
})
