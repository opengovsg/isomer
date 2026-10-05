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
import {
  normalizeColspan,
  normalizeRowspan,
  rowCells,
} from "./tableLayoutLimits"

const tableStyles = tv({
  base: "border-collapse border-spacing-0 border border-base-divider-medium",
  variants: {
    isFixedLayout: {
      true: "table-fixed",
      false: "w-full",
    },
  },
})

const tableCellStyles = tv({
  base: "break-words border border-base-divider-medium px-4 py-3 align-top [&_li]:mb-4 [&_li]:mt-0 [&_li]:pl-1 [&_ol]:mt-0 [&_ol]:ps-5 [&_ul]:mt-0 [&_ul]:ps-5",
  variants: {
    isHeader: {
      true: "bg-base-canvas-backdrop [&_ol]:prose-label-md-bold [&_p]:prose-label-md-bold [&_ul]:prose-label-md-bold",
      false: "bg-base-canvas-alt [&_ol]:prose-body-sm [&_p]:prose-body-sm",
    },
    isAutoLayout: {
      true: "max-w-40",
      false: "",
    },
  },
})

export const Table = ({
  attrs: { caption, columnWidths: storedColumnWidths },
  content,
  site,
}: TableProps) => {
  const tableDescriptionId = useId()
  const layout = resolveTableLayout(content, storedColumnWidths)
  const isAuthorSized =
    layout.kind === "fixed" && layout.tableWidthPx > 0

  return (
    <div className="flex flex-col gap-4 [&:not(:first-child)]:mt-7">
      <BaseParagraph
        id={tableDescriptionId}
        content={caption}
        className="prose-label-md-regular text-base-content-subtle [&:not(:last-child)]:mb-0"
      />
      <div className="overflow-x-auto" tabIndex={0}>
        <table
          className={tableStyles({ isFixedLayout: layout.kind === "fixed" })}
          style={
            isAuthorSized ? { width: `${layout.tableWidthPx}px` } : undefined
          }
          aria-describedby={tableDescriptionId}
        >
          {layout.kind === "fixed" && (
            <colgroup>
              {layout.columnWidths.map((width, index) => (
                <col key={index} style={{ width }} />
              ))}
            </colgroup>
          )}
          <tbody>
            {content.map((row, index) => (
              <tr key={index} className="text-left">
                {rowCells(row).map((cell, cellIndex) => {
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
                      className={tableCellStyles({
                        isHeader,
                        isAutoLayout: layout.kind === "auto",
                      })}
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
