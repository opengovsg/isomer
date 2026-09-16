/**
 * Gutter sizes shared by TableNodeView and TableDragHandles.
 * Handle styling is in drag-handles/internal/chrome.ts.
 */

/** Space between the table edge and handles or add pills. */
export const TABLE_CHROME_GAP_PX = 8

/** Thickness of a handle or add pill across the gutter. */
export const TABLE_CHROME_THICKNESS_PX = 20

/** Total gutter on each side of a table (gap + thickness). */
export const TABLE_GUTTER_PX = TABLE_CHROME_GAP_PX + TABLE_CHROME_THICKNESS_PX
