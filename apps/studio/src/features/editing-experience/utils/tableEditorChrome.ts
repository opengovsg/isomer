/**
 * The layout contract between the table node view and `TableDragHandles`: the
 * node view reserves a gutter around every table, and the handles and add pills
 * are drawn into it. Both sides have to agree, so the gutter and the two
 * measurements it derives from live here rather than inside either component.
 *
 * Everything else about how that chrome looks is private to
 * `TableDragHandles/internal/chrome.ts`.
 */

/** How far the handles and add pills sit from the table's edge. */
export const TABLE_CHROME_GAP_PX = 8

/** How thick a handle or add pill is, measured across the gutter. */
export const TABLE_CHROME_THICKNESS_PX = 20

/**
 * The band reserved on every side of a table. Handles occupy the top and left
 * of it, add pills the bottom and right, and the pointer counts as hovering a
 * table anywhere within it.
 */
export const TABLE_GUTTER_PX = TABLE_CHROME_GAP_PX + TABLE_CHROME_THICKNESS_PX
