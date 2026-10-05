/**
 * Gutter sizes shared by the table node view and `TableDragHandles`. The node
 * view pads every table; handles and add pills render into that padding. These
 * constants live here so both sides stay in sync.
 *
 * Handle and pill styling is in `TableDragHandles/internal/chrome.ts`.
 */

/** How far the handles and add pills sit from the table's edge. */
export const TABLE_CHROME_GAP_PX = 8

/** How thick a handle or add pill is, measured across the gutter. */
export const TABLE_CHROME_THICKNESS_PX = 20

/**
 * The band reserved on every side of a table. The left and right bands sit
 * outside the horizontal scroller, so row handles and the add-column pill stay
 * put and the table never scrolls underneath them. Top and bottom bands are
 * inside the scroller, for column handles and the add-row pill.
 */
export const TABLE_GUTTER_PX = TABLE_CHROME_GAP_PX + TABLE_CHROME_THICKNESS_PX
