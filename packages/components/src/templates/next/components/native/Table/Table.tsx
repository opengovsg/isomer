"use client"

import { useEffect, useId, useRef, useState } from "react"

import type { TableProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import BaseParagraph from "../../internal/BaseParagraph"
import Divider from "../Divider"
import OrderedList from "../OrderedList"
import Paragraph from "../Paragraph"
import UnorderedList from "../UnorderedList"

// Determine if the table is larger than the parent container (usually the screen width)
const getIsTableOverflowing = (tableRef: React.RefObject<HTMLTableElement>) => {
  const tableRight = tableRef.current?.getBoundingClientRect().right || 0
  const parentRight =
    tableRef.current?.parentElement?.getBoundingClientRect().right || 0
  return tableRight > parentRight
}

// Determine the exact rows of the table that should have a sticky first part
// This works by first assuming that all rows in the table should have a sticky
// first part, then omitting rows that overlap with a previous row containing
// a rowSpan definition. The first cells in these rows would be part of the
// second column.
// Example: If row index 2 has a rowSpan of 3, then row index 3 and 4 should not
// have a sticky first part.
const getStickyRowIndexes = (tableRows: TableProps["content"]) => {
  let stickyRowIndexes: number[] = [...Array(tableRows.length).keys()]

  tableRows
    .map((row) => row.content[0])
    .forEach((row, index) => {
      if (row?.attrs) {
        if (!stickyRowIndexes.includes(index)) {
          // Index has already been removed by an earlier rowSpan
          return
        }
        const rowspan = row.attrs.rowspan
        if (rowspan !== undefined) {
          // Exclude the next few rows that are covered by the rowSpan
          stickyRowIndexes = stickyRowIndexes.filter(
            (value) => value <= index || value >= index + rowspan,
          )
        }
      }
    })

  return stickyRowIndexes
}

const tableCellStyles = tv({
  base: "max-w-40 break-words border-r border-t border-base-divider-medium px-4 py-3 align-top last:max-w-full last:border-r-0 last-of-type:border-r [&_li]:my-0 [&_li]:pl-1 [&_ol]:mt-0 [&_ol]:ps-5 [&_ul]:mt-0 [&_ul]:ps-5",
  variants: {
    isHeader: {
      true: "bg-base-canvas-backdrop [&_ol]:prose-label-md-medium [&_p]:prose-label-md-medium",
      false: "bg-base-canvas-alt [&_ol]:prose-body-sm [&_p]:prose-body-sm",
    },
    isOverflowing: {
      true: "border-l shadow-[rgba(191,191,191,0.4)_3px_0px_3px_0px]",
    },
    isFirstCell: {
      true: "sticky left-0 border-l",
    },
    isLastRow: {
      true: "border-b",
    },
  },
})

const Table = ({ attrs: { caption }, content }: TableProps) => {
  const [isTableOverflowing, setIsTableOverflowing] = useState(false)
  const tableRef = useRef<HTMLTableElement>(null)
  const stickyRowIndexes = getStickyRowIndexes(content)

  const tableDescriptionId = useId()

  useEffect(() => {
    const onResize = () =>
      setIsTableOverflowing(getIsTableOverflowing(tableRef))

    onResize()
    window.addEventListener("resize", onResize)

    // Cleanup on unmount
    return () => window.removeEventListener("resize", onResize)
  }, [])

  return (
    <div className="flex flex-col gap-4 [&:not(:first-child)]:mt-7">
      <BaseParagraph
        id={tableDescriptionId}
        content={caption}
        className="prose-label-md-regular text-base-content-subtle [&:not(:last-child)]:mb-0"
      />
      <div className="overflow-x-auto">
        <table
          className="w-full border-separate border-spacing-0"
          aria-describedby={tableDescriptionId}
          ref={tableRef}
        >
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
                          isOverflowing:
                            stickyRowIndexes.includes(index) &&
                            cellIndex === 0 &&
                            isTableOverflowing,
                          isFirstCell:
                            stickyRowIndexes.includes(index) && cellIndex === 0,
                          isLastRow: index === content.length - 1,
                        })}
                      >
                        {cell.content.map((cellContent, index) => {
                          switch (cellContent.type) {
                            case "divider":
                              return <Divider key={index} {...cellContent} />
                            case "orderedList":
                              return (
                                <OrderedList key={index} {...cellContent} />
                              )
                            case "paragraph":
                              return <Paragraph key={index} {...cellContent} />
                            case "unorderedList":
                              return (
                                <UnorderedList key={index} {...cellContent} />
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

export default Table
