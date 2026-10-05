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
 * The band around a table, inside its horizontal scroller. Handles occupy the
 * top and left, add pills the bottom and right. A wide table scrolls through
 * the left and right bands, under the row handles and the add-column pill.
 */
export const TABLE_GUTTER_PX = TABLE_CHROME_GAP_PX + TABLE_CHROME_THICKNESS_PX
