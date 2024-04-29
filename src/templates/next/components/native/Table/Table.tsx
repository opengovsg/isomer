"use client"

import { useEffect, useRef, useState } from "react"
import type { TableProps } from "~/interfaces"
import BaseParagraph from "../../internal/BaseParagraph"
import { Caption } from "../../../typography/Caption"
import Prose from "../Prose"

const getIsTableOverflowing = (tableRef: React.RefObject<HTMLTableElement>) => {
  const tableRight = tableRef.current?.getBoundingClientRect().right || 0
  const parentRight =
    tableRef.current?.parentElement?.getBoundingClientRect().right || 0
  return tableRight > parentRight
}

const Table = ({ caption, content }: TableProps) => {
  const [isTableOverflowing, setIsTableOverflowing] = useState(false)
  const tableRef = useRef<HTMLTableElement>(null)

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
        className="border-separate border-spacing-0 relative"
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
                      className={`border-divide-subtle border-r border-b first:border-l first:sticky first:left-0 min-w-40 align-top [&_ul]:mt-0 [&_ul]:ps-5 [&_ol]:mt-0 [&_ol]:ps-5 [&_ol]:text-sm [&_li]:my-0 [&_li]:pl-1 px-4 ${
                        cell.type === "tableHeader"
                          ? "bg-utility-neutral py-[1.125rem]"
                          : "bg-utility-neutral-subtle py-3.5 [&_p]:text-sm"
                      } ${
                        cellIndex === 0 && isTableOverflowing
                          ? "shadow-[rgba(191,191,191,0.4)_5px_0px_3px_-3px]"
                          : ""
                      }`}
                    >
                      {cell.type === "tableHeader" ? (
                        <Prose content={cell.content} inline={true} />
                      ) : (
                        <Prose content={cell.content} inline={true} />
                      )}
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
