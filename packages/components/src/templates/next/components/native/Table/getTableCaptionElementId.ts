import type { TableProps } from "~/interfaces"

function hashString(value: string): string {
  let hash = 5381
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i)
  }
  return (hash >>> 0).toString(36)
}

/** Stable DOM id for associating an external caption with its table (no React useId). */
export const getTableCaptionElementId = (
  caption: string,
  content: TableProps["content"],
): string => {
  const rowCount = content.length
  const cellCount = content.reduce((n, row) => n + row.content.length, 0)
  return `isomer-table-caption-${hashString(`${caption}\0${rowCount}\0${cellCount}`)}`
}

export const hasVisibleTableCaption = (caption: string): boolean =>
  caption.trim() !== ""
