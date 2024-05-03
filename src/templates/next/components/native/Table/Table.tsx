"use client"

import { useEffect, useRef, useState } from "react"
import type { TableProps } from "~/interfaces"
import BaseParagraph from "../../internal/BaseParagraph"
import { Caption } from "../../../typography/Caption"
import Prose from "../Prose"

// Determine if the table is larger than the parent container (usually the screen width)
const getIsTableOverflowing = (tableRef: React.RefObject<HTMLTableElement>) => {
  const tableRight = tableRef.current?.getBoundingClientRect().right || 0
  const parentRight =
    tableRef.current?.parentElement?.getBoundingClientRect().right || 0
  return tableRight > parentRight
}

// Determine the extent in which the table should have a sticky first part
const getStickyRowIndexes = (tableRows: TableProps["content"]) => {
  let stickyRowIndexes: number[] = [...Array(tableRows.length).keys()]

  tableRows
    .map((row) => row.content[0])
    .forEach((cell, index) => {
      if (!stickyRowIndexes.includes(index)) {
        return
      }

      if (cell.rowSpan) {
        stickyRowIndexes = stickyRowIndexes.filter(
          (value) => value <= index || value >= index + cell.rowSpan!,
        )
      }
    })

  return stickyRowIndexes
}

const Table = ({ caption, content }: TableProps) => {
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
        className="border-separate border-spacing-0 relative w-full"
        ref={tableRef}
      >
        <caption className="caption-top mb-4 text-left">
          <BaseParagraph
            content={caption}
            className={`text-content text-balance table-header-group sticky left-0 ${Caption["1"]}`}
          />
        </caption>
        <tbody>
          {content.map((row, index) => {
            const TableCellTag =
              row.content[0].type === "tableHeader" ? "th" : "td"

            return (
              <tr
                key={index}
                className="*:first:border-t *:first:border-divide-subtle"
              >
                {row.content.map((cell, cellIndex) => {
                  return (
                    <TableCellTag
                      key={cellIndex}
                      colSpan={cell.colSpan}
                      rowSpan={cell.rowSpan}
                      className={`border-divide-subtle border-r border-b first:border-l max-w-40 last:max-w-full break-words align-top [&_ul]:mt-0 [&_ul]:ps-5 [&_ol]:mt-0 [&_ol]:ps-5 [&_ol]:text-sm [&_li]:my-0 [&_li]:pl-1 px-4 py-3.5 ${
                        cell.type === "tableHeader"
                          ? "bg-utility-neutral"
                          : "bg-utility-neutral-subtle [&_p]:text-sm"
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
                      <Prose content={cell.content} />
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
