/** Matches VStack `gap="0.25rem"` on the bubble menu. */
export const TABLE_BUBBLE_MENU_GAP_PX = 4

/** Minimum distance from the viewport edge before flipping placement. */
export const TABLE_BUBBLE_MENU_VIEWPORT_PADDING_PX = 8

export type TableBubbleMenuPlacement = "above" | "below"

export interface TableBubbleMenuPosition {
  x: number
  y: number
  placement: TableBubbleMenuPlacement
}

export interface TableBubbleMenuDimensions {
  triggerWidth: number
  triggerHeight: number
  actionsHeight: number
}

export const getTableBubbleMenuDimensions = (
  menuEl: HTMLElement,
  isActivated: boolean,
): TableBubbleMenuDimensions | null => {
  const triggerEl = menuEl.querySelector("[data-table-bubble-menu-trigger]")
  if (!(triggerEl instanceof HTMLElement)) return null

  const actionsEl = menuEl.querySelector("[data-table-bubble-menu-actions]")
  const actionsHeight =
    isActivated && actionsEl instanceof HTMLElement ? actionsEl.offsetHeight : 0

  return {
    triggerWidth: triggerEl.offsetWidth,
    triggerHeight: triggerEl.offsetHeight,
    actionsHeight,
  }
}

export const computeTableBubbleMenuPlacement = ({
  cellRect,
  dimensions,
  isActivated,
  viewportHeight = window.innerHeight,
  viewportPadding = TABLE_BUBBLE_MENU_VIEWPORT_PADDING_PX,
}: {
  cellRect: DOMRect
  dimensions: TableBubbleMenuDimensions
  isActivated: boolean
  viewportHeight?: number
  viewportPadding?: number
}): TableBubbleMenuPlacement => {
  if (!isActivated || dimensions.actionsHeight === 0) {
    return "above"
  }

  const { triggerHeight, actionsHeight } = dimensions
  const gap = TABLE_BUBBLE_MENU_GAP_PX

  const menuTopIfAbove =
    cellRect.bottom - actionsHeight - gap - triggerHeight / 2
  const fitsAbove = menuTopIfAbove >= viewportPadding

  const menuBottomIfBelow =
    cellRect.bottom + triggerHeight / 2 + gap + actionsHeight
  const fitsBelow = menuBottomIfBelow <= viewportHeight - viewportPadding

  if (fitsAbove) return "above"
  if (fitsBelow) return "below"

  const spaceAbove = cellRect.top - viewportPadding
  const spaceBelow = viewportHeight - viewportPadding - cellRect.bottom

  return spaceBelow > spaceAbove ? "below" : "above"
}

export const computeTableBubbleMenuPosition = ({
  cellRect,
  menuEl,
  dimensions,
  placement,
}: {
  cellRect: DOMRect
  menuEl: HTMLElement
  dimensions: TableBubbleMenuDimensions
  placement: TableBubbleMenuPlacement
}): Pick<TableBubbleMenuPosition, "x" | "y"> | null => {
  const triggerEl = menuEl.querySelector("[data-table-bubble-menu-trigger]")
  if (!(triggerEl instanceof HTMLElement)) return null

  const { triggerWidth, triggerHeight, actionsHeight } = dimensions
  const gap = TABLE_BUBBLE_MENU_GAP_PX

  const triggerOffsetTop =
    placement === "above" && actionsHeight > 0 ? actionsHeight + gap : 0

  return {
    x: cellRect.right - triggerWidth / 2 - triggerEl.offsetLeft,
    y: cellRect.bottom - triggerHeight / 2 - triggerOffsetTop,
  }
}
