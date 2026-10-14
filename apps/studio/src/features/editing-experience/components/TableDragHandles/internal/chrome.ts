/**
 * How the handles and add pills look. Private to `TableDragHandles`. Gutter
 * sizes are shared via `utils/tableEditorChrome.ts`.
 */

import { TABLE_CHROME_THICKNESS_PX } from "~/features/editing-experience/utils/tableEditorChrome"

/** Handles are rectangular: thin across the gutter, longer along the slot. */
const HANDLE_LENGTH_PX = 32

export const HANDLE_BORDER_RADIUS_PX = 4
export const ROW_HANDLE = { w: TABLE_CHROME_THICKNESS_PX, h: HANDLE_LENGTH_PX }
export const COL_HANDLE = { w: HANDLE_LENGTH_PX, h: TABLE_CHROME_THICKNESS_PX }

/** Add pills stretch to the table's edge, but stay tappable on tiny tables. */
export const ADD_PILL_MIN_LENGTH_PX = 48
export const ADD_PILL_RADIUS_PX = 99
export const ADD_PILL_ICON_SIZE_PX = 12
