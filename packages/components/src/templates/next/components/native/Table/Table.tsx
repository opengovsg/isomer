import type { TableProps } from "~/interfaces"
import { useId } from "react"
import { getTableCellBackgroundColorCss } from "~/constants/tableCellBackgroundColor"
import { tv } from "~/lib/tv"

import { BaseParagraph } from "../../internal/BaseParagraph"
import { Divider } from "../Divider"
import { OrderedList } from "../OrderedList"
import { Paragraph } from "../Paragraph"
import { UnorderedList } from "../UnorderedList"
import { resolveTableLayout } from "./resolveTableLayout"
import { normalizeColspan, normalizeRowspan } from "./tableLayoutLimits"

const tableStyles = tv({
  base: "w-full border-collapse border-spacing-0 border border-base-divider-medium",
  variants: {
    isFixedLayout: {
      true: "table-fixed",
    },
  },
})

const tableCellStyles = tv({
  base: "max-w-40 break-words border border-base-divider-medium px-4 py-3 align-top [&_li]:mb-4 [&_li]:mt-0 [&_li]:pl-1 [&_ol]:mt-0 [&_ol]:ps-5 [&_ul]:mt-0 [&_ul]:ps-5",
  variants: {
    isHeader: {
      true: "bg-base-canvas-backdrop [&_ol]:prose-label-md-medium [&_p]:prose-label-md-medium",
      false: "bg-base-canvas-alt [&_ol]:prose-body-sm [&_p]:prose-body-sm",
    },
  },
})

// Only a row with no colspan on any cell unambiguously maps 1 cell to 1
// column, so that's the only shape we can read explicit widths back out of.
const getColumnWidths = (content: TableProps["content"]): number[] | null => {
  const columnCounts = content.map((row) =>
    row.content.reduce((sum, cell) => sum + (cell.attrs?.colspan ?? 1), 0),
  )
  const columnCount = Math.max(...columnCounts)

  const widthsRow = content.find(
    (row, index) =>
      columnCounts[index] === columnCount &&
      row.content.every((cell) => (cell.attrs?.colspan ?? 1) === 1),
  )
  if (!widthsRow) {
    return null
  }

  const widths = widthsRow.content.map((cell) => cell.attrs?.colwidth)
  if (widths.some((width) => width === undefined)) {
    return null
  }

  return widths as number[]
}

export const Table = ({ attrs: { caption }, content, site }: TableProps) => {
  const tableDescriptionId = useId()
  const layout = resolveTableLayout(content)
  const columnWidths = getColumnWidths(content)
  const isFixedLayout = columnWidths !== null || layout.kind === "fixed"

  return (
    <div className="flex flex-col gap-4 [&:not(:first-child)]:mt-7">
      <BaseParagraph
        id={tableDescriptionId}
        content={caption}
        className="prose-label-md-regular text-base-content-subtle [&:not(:last-child)]:mb-0"
      />
      <div className="overflow-x-auto" tabIndex={0}>
        <table
          className={tableStyles({ isFixedLayout })}
          aria-describedby={tableDescriptionId}
        >
          {columnWidths ? (
            <colgroup>
              {columnWidths.map((width, index) => (
                <col key={index} style={{ width: `${width}%` }} />
              ))}
            </colgroup>
          ) : (
            layout.kind === "fixed" && (
              <colgroup>
                {layout.columnWidths.map((width, index) => (
                  <col key={index} style={{ width }} />
                ))}
              </colgroup>
            )
          )}
          <tbody>
            {content.map((row, index) => (
              <tr key={index} className="text-left">
                {row.content.map((cell, cellIndex) => {
                  const isHeader = cell.type === "tableHeader"
                  const CellTag = isHeader ? "th" : "td"
                  const backgroundColor = getTableCellBackgroundColorCss(
                    cell.attrs?.backgroundColor,
                  )

                  return (
                    <CellTag
                      key={cellIndex}
                      colSpan={normalizeColspan(cell.attrs?.colspan)}
                      rowSpan={normalizeRowspan(cell.attrs?.rowspan)}
                      className={tableCellStyles({ isHeader })}
                      style={backgroundColor ? { backgroundColor } : undefined}
                    >
                      {cell.content.map((cellContent, index) => {
                        switch (cellContent.type) {
                          case "divider":
                            return <Divider key={index} {...cellContent} />
                          case "orderedList":
                            return (
                              <OrderedList
                                key={index}
                                {...cellContent}
                                site={site}
                              />
                            )
                          case "paragraph":
                            return (
                              <Paragraph
                                key={index}
                                {...cellContent}
                                site={site}
                              />
                            )
                          case "unorderedList":
                            return (
                              <UnorderedList
                                key={index}
                                {...cellContent}
                                site={site}
                              />
                            )
                          default:
                            const _: never = cellContent
                            return <></>
                        }
                      })}
                    </CellTag>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
