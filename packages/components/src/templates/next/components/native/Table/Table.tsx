import type { TableProps } from "~/interfaces"
import { useId } from "react"
import { tv } from "~/lib/tv"
import { resolveColumnWidths } from "~/utils/getTableColumnWidths"

import { BaseParagraph } from "../../internal/BaseParagraph"
import { Divider } from "../Divider"
import { OrderedList } from "../OrderedList"
import { Paragraph } from "../Paragraph"
import { UnorderedList } from "../UnorderedList"

const tableCellStyles = tv({
  base: "max-w-40 break-words border border-base-divider-medium px-4 py-3 align-top [&_li]:mb-4 [&_li]:mt-0 [&_li]:pl-1 [&_ol]:mt-0 [&_ol]:ps-5 [&_ul]:mt-0 [&_ul]:ps-5",
  variants: {
    isHeader: {
      true: "bg-base-canvas-backdrop [&_ol]:prose-label-md-medium [&_p]:prose-label-md-medium",
      false: "bg-base-canvas-alt [&_ol]:prose-body-sm [&_p]:prose-body-sm",
    },
  },
})

const getColumnCount = (content: TableProps["content"]): number =>
  Math.max(
    ...content.map((row) =>
      row.content.reduce((sum, cell) => sum + (cell.attrs?.colspan ?? 1), 0),
    ),
  )

export const Table = ({
  attrs: { caption, colwidths },
  content,
  site,
}: TableProps) => {
  const tableDescriptionId = useId()
  // A column's width should only ever change because of an explicit resize
  // drag, never because of how much text happens to be typed into a cell --
  // which an equal split, rendered under `table-layout: fixed`, guarantees
  // regardless of content. `resolveColumnWidths` falls back to that split
  // whenever `colwidths` is missing (pre-feature content), `null` (never
  // resized), or the wrong length (stale, from before a column add/remove
  // was normalized) -- the same fallback the editor applies.
  const columnWidths = resolveColumnWidths(colwidths, getColumnCount(content))

  return (
    <div className="flex flex-col gap-4 [&:not(:first-child)]:mt-7">
      <BaseParagraph
        id={tableDescriptionId}
        content={caption}
        className="prose-label-md-regular text-base-content-subtle [&:not(:last-child)]:mb-0"
      />
      <div className="overflow-x-auto" tabIndex={0}>
        <table
          className="w-full table-fixed border-collapse border-spacing-0 border border-base-divider-medium"
          aria-describedby={tableDescriptionId}
        >
          <colgroup>
            {columnWidths.map((width, index) => (
              <col key={index} style={{ width: `${width}%` }} />
            ))}
          </colgroup>
          <tbody>
            {content.map((row, index) => {
              const TableCellTag =
                row.content[0]?.type === "tableHeader" ? "th" : "td"

              return (
                <tr key={index} className="text-left">
                  {row.content.map((cell, cellIndex) => {
                    return (
                      <TableCellTag
                        key={cellIndex}
                        colSpan={cell.attrs?.colspan || 1}
                        rowSpan={cell.attrs?.rowspan || 1}
                        className={tableCellStyles({
                          isHeader: cell.type === "tableHeader",
                        })}
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
                      </TableCellTag>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
