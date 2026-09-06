import type { TableProps } from "~/interfaces"
import { useId } from "react"
import { tv } from "~/lib/tv"
import { getProseContentKey } from "~/utils/getProseContentKey"
import { handleHorizontalScrollKeyDown } from "~/utils/handleHorizontalScrollKeyDown"

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

export const Table = ({ attrs: { caption }, content, site }: TableProps) => {
  const tableDescriptionId = useId()
  const layout = resolveTableLayout(content)

  return (
    <div className="flex flex-col gap-4 [&:not(:first-child)]:mt-7">
      <BaseParagraph
        id={tableDescriptionId}
        content={caption}
        className="prose-label-md-regular text-base-content-subtle [&:not(:last-child)]:mb-0"
      />
      {/* oxlint-disable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions -- keyboard-focusable scroll container for wide tables */}
      <section
        className="overflow-x-auto"
        tabIndex={0}
        aria-label="Scrollable table"
        onKeyDown={handleHorizontalScrollKeyDown}
      >
        <table
          className={tableStyles({ isFixedLayout: layout.kind === "fixed" })}
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
            {content.map((row) => {
              const TableCellTag =
                row.content[0]?.type === "tableHeader" ? "th" : "td"

              return (
                <tr key={getProseContentKey(row)} className="text-left">
                  {row.content.map((cell) => {
                    return (
                      <TableCellTag
                        key={getProseContentKey(cell)}
                        colSpan={normalizeColspan(cell.attrs?.colspan)}
                        rowSpan={normalizeRowspan(cell.attrs?.rowspan)}
                        className={tableCellStyles({
                          isHeader: cell.type === "tableHeader",
                        })}
                      >
                        {cell.content.map((cellContent) => {
                          switch (cellContent.type) {
                            case "divider":
                              return (
                                <Divider
                                  key={getProseContentKey(cellContent)}
                                  {...cellContent}
                                />
                              )
                            case "orderedList":
                              return (
                                <OrderedList
                                  key={getProseContentKey(cellContent)}
                                  {...cellContent}
                                  site={site}
                                />
                              )
                            case "paragraph":
                              return (
                                <Paragraph
                                  key={getProseContentKey(cellContent)}
                                  {...cellContent}
                                  site={site}
                                />
                              )
                            case "unorderedList":
                              return (
                                <UnorderedList
                                  key={getProseContentKey(cellContent)}
                                  {...cellContent}
                                  site={site}
                                />
                              )
                            default:
                              const _: never = cellContent
                              return null
                          }
                        })}
                      </TableCellTag>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
      {/* oxlint-enable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */}
    </div>
  )
}
