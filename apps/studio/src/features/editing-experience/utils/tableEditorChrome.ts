export const ADD_PILL_GAP_PX = 8
export const ADD_PILL_THICKNESS_PX = 20
export const ADD_PILL_MIN_LENGTH_PX = 48
export const ADD_PILL_RADIUS_PX = 99
export const ADD_PILL_ICON_SIZE_PX = 12
// A raw SVG `fill` attribute rather than a style prop, so it cannot be a token.
export const ADD_PILL_ICON_FILL = "#2C2E34"
export const TABLE_ADD_CHROME_PX = ADD_PILL_GAP_PX + ADD_PILL_THICKNESS_PX

export const HANDLE_GAP_PX = ADD_PILL_GAP_PX
export const HANDLE_BORDER_RADIUS_PX = 4
export const HANDLE_THICKNESS_PX = 20
export const HANDLE_LENGTH_PX = 32
export const ROW_HANDLE = { w: HANDLE_THICKNESS_PX, h: HANDLE_LENGTH_PX }
export const COL_HANDLE = { w: HANDLE_LENGTH_PX, h: HANDLE_THICKNESS_PX }
export const HANDLE_MARGIN_PX = HANDLE_GAP_PX + ROW_HANDLE.w

export const isPointerInTableChrome = ({
  clientX,
  clientY,
  tableLeft,
  tableTop,
  tableRight,
  tableBottom,
}: {
  clientX: number
  clientY: number
  tableLeft: number
  tableTop: number
  tableRight: number
  tableBottom: number
}): boolean =>
  clientX >= tableLeft - HANDLE_MARGIN_PX &&
  clientX <= tableRight + TABLE_ADD_CHROME_PX &&
  clientY >= tableTop - HANDLE_MARGIN_PX &&
  clientY <= tableBottom + TABLE_ADD_CHROME_PX
