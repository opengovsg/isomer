import { useEffect, useRef, useState } from "react"
import type { TableProps } from "~/common"
import { Paragraph } from "../../typography/Paragraph"
import BaseParagraph from "../shared/Paragraph"
import Image from "../Image"
import OrderedList from "../OrderedList"
import UnorderedList from "../UnorderedList"
import { Caption } from "../../typography/Caption"

const getIsTableOverflowing = (tableRef: React.RefObject<HTMLTableElement>) => {
  const tableRight = tableRef.current?.getBoundingClientRect().right || 0
  const parentRight =
    tableRef.current?.parentElement?.getBoundingClientRect().right || 0
  return tableRight > parentRight
}

const Table = ({ rows, caption }: TableProps) => {
  const [isTableOverflowing, setIsTableOverflowing] = useState(false)
  const tableRef = useRef<HTMLTableElement>(null)
  // Generate a random ID for the caption that is sufficiently unique
  const captionId = `caption-${Math.random()}`

  useEffect(() => {
    const onResize = () =>
      setIsTableOverflowing(getIsTableOverflowing(tableRef))

    onResize()
    window.addEventListener("resize", onResize)

    // Cleanup on unmount
    return () => window.removeEventListener("resize", onResize)
  }, [])

  return (
    <div className="flex flex-col gap-4 [&:not(:first-child)]:mt-6">
      <BaseParagraph
        content={caption}
        className={`text-content text-balance ${Caption["1"]}`}
        id={captionId}
      />
      <div className="overflow-x-auto">
        <table
          className="border-separate border-spacing-0 relative"
          ref={tableRef}
          aria-describedby={captionId}
        >
          <tbody>
            {rows.map((row, index) => {
              const TableCellTag =
                row.cells[0].variant === "tableHeader" ? "th" : "td"

              return (
                <tr
                  key={index}
                  className="*:first:border-t *:first:border-divide-subtle"
                >
                  {row.cells.map((cell, cellIndex) => {
                    return (
                      <TableCellTag
                        key={cellIndex}
                        colSpan={cell.colSpan}
                        rowSpan={cell.rowSpan}
                        className={`border-divide-subtle border-r border-b first:border-l first:sticky first:left-0 min-w-40 align-top [&_ul]:mt-0 [&_ul]:ps-5 [&_ol]:mt-0 [&_ol]:ps-5 [&_ol]:text-sm [&_li]:my-0 [&_li]:pl-1 px-4 ${
                          cell.variant === "tableHeader"
                            ? "bg-utility-neutral py-[1.125rem]"
                            : "bg-utility-neutral-subtle py-3.5 [&_p]:text-sm"
                        } ${
                          cellIndex === 0 && isTableOverflowing
                            ? "shadow-[rgba(191,191,191,0.4)_5px_0px_3px_-3px]"
                            : ""
                        }`}
                      >
                        {cell.variant === "tableHeader" ? (
                          <BaseParagraph
                            content={cell.value}
                            className={`text-content-string text-left text-balance ${Caption["1-medium-lg"]}`}
                          />
                        ) : (
                          cell.value.map((value, valueIndex) => {
                            if (typeof value === "string") {
                              return (
                                <BaseParagraph
                                  content={value}
                                  key={valueIndex}
                                  className={`text-content text-balance`}
                                />
                              )
                            } else if (value.type === "image") {
                              return <Image key={valueIndex} {...value} />
                            } else if (value.type === "orderedlist") {
                              return <OrderedList key={valueIndex} {...value} />
                            } else if (value.type === "unorderedlist") {
                              return (
                                <UnorderedList key={valueIndex} {...value} />
                              )
                            } else {
                              return <></>
                            }
                          })
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
    </div>
  )
}

export default Table
