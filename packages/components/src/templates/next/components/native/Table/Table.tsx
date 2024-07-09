"use client"

import { useEffect, useRef, useState } from "react"

import type { TableProps } from "~/interfaces"
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
    .forEach(({ attrs }, index) => {
      if (!stickyRowIndexes.includes(index)) {
        // Index has already been removed by an earlier rowSpan
        return
      }

      if (attrs && attrs.rowspan) {
        // Exclude the next few rows that are covered by the rowSpan
        stickyRowIndexes = stickyRowIndexes.filter(
          (value) => value <= index || value >= index + attrs.rowspan!,
        )
      }
    })

  return stickyRowIndexes
}

const Table = ({ attrs: { caption }, content }: TableProps) => {
  const [isTableOverflowing, setIsTableOverflowing] = useState(false)
  const tableRef = useRef<HTMLTableElement>(null)
  const stickyRowIndexes = getStickyRowIndexes(content)

  useEffect(() => {
    const onResize = () =>
      setIsTableOverflowing(getIsTableOverflowing(tableRef))

    onResize()
    window.addEventListener("resize", onResize)

    // Cleanup on unmount
    return () => window.removeEventListener("resize", onResize)
  }, [])

  return (
    <div className="overflow-x-auto [&:not(:first-child)]:mt-6">
      <table
        className="relative w-full border-separate border-spacing-0"
        ref={tableRef}
      >
        <caption className="mb-4 caption-top text-left">
          <BaseParagraph
            content={caption}
            className="sticky left-0 table-header-group text-balance text-content text-caption-01"
          />
        </caption>
        <tbody>
          {content.map((row, index) => {
            const TableCellTag =
              row.content[0].type === "tableHeader" ? "th" : "td"

            return (
              <tr
                key={index}
                className="*:first:border-divide-subtle text-left *:first:border-t"
              >
                {row.content.map((cell, cellIndex) => {
                  return (
                    <TableCellTag
                      key={cellIndex}
                      colSpan={cell.attrs?.colspan || 1}
                      rowSpan={cell.attrs?.rowspan || 1}
                      className={`border-divide-subtle max-w-40 break-words border-b border-r px-4 py-3.5 align-top first:border-l last:max-w-full [&_li]:my-0 [&_li]:pl-1 [&_ol]:mt-0 [&_ol]:ps-5 [&_ol]:text-sm [&_p]:text-sm [&_ul]:mt-0 [&_ul]:ps-5 ${
                        cell.type === "tableHeader"
                          ? "bg-utility-neutral"
                          : "bg-utility-neutral-subtle"
                      } ${
                        stickyRowIndexes.includes(index) &&
                        cellIndex === 0 &&
                        isTableOverflowing
                          ? "shadow-[rgba(191,191,191,0.4)_3px_0px_3px_0px]"
                          : ""
                      } ${
                        stickyRowIndexes.includes(index) && cellIndex === 0
                          ? "sticky left-0"
                          : ""
                      }`}
                    >
                      {cell.content.map((cellContent, index) => {
                        if (cellContent.type === "divider") {
                          return <Divider key={index} {...cellContent} />
                        } else if (cellContent.type === "orderedList") {
                          return <OrderedList key={index} {...cellContent} />
                        } else if (cellContent.type === "paragraph") {
                          return <Paragraph key={index} {...cellContent} />
                        } else if (cellContent.type === "unorderedList") {
                          return <UnorderedList key={index} {...cellContent} />
                        } else {
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
  )
}

export default Table
