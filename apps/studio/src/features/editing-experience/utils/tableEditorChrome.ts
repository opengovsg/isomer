export const HANDLE_MARGIN_PX = 28
export const ADD_PILL_GAP_PX = 8
export const ADD_PILL_THICKNESS_PX = 20
export const ADD_PILL_MIN_LENGTH_PX = 48
export const TABLE_ADD_CHROME_PX = ADD_PILL_GAP_PX + ADD_PILL_THICKNESS_PX

export const HANDLE_BORDER_PX = 1
export const HANDLE_BORDER_RADIUS_PX = 4
export const HANDLE_ICON_PX = 12
export const ROW_HANDLE = { w: 20, h: 32 }
export const COL_HANDLE = { w: 32, h: 20 }

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
