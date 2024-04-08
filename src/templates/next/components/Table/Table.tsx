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
  return tableRight > window.innerWidth
}

const Table = ({ items, caption, LinkComponent = "a" }: TableProps) => {
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
    <div className="flex flex-col gap-4">
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
            {items.map((item, index) => {
              const TableCellTag =
                item.cells[0].type === "tableHeader" ? "th" : "td"

              return (
                <tr
                  key={index}
                  className="*:first:border-t *:first:border-divide-subtle"
                >
                  {item.cells.map((cell, cellIndex) => {
                    return (
                      <TableCellTag
                        key={cellIndex}
                        colSpan={cell.colSpan}
                        rowSpan={cell.rowSpan}
                        className={`border-divide-subtle border-r border-b first:border-l first:sticky first:left-0 min-w-40 [&_ul]:mt-0 [&_ol]:mt-0 [&_li]:my-0 [&_a]:no-underline px-4 ${
                          cell.type === "tableHeader"
                            ? `bg-utility-neutral py-[1.125rem] text-content-strong text-left text-balance ${Caption["1-medium-lg"]}`
                            : `bg-utility-neutral-subtle py-3.5 ${Caption["1"]}`
                        } ${
                          cellIndex === 0 && isTableOverflowing
                            ? "shadow-[rgba(191,191,191,0.4)_5px_0px_3px_-3px]"
                            : ""
                        }`}
                      >
                        {cell.value.map((value, valueIndex) => {
                          if (typeof value === "string") {
                            return (
                              <BaseParagraph
                                content={value}
                                key={valueIndex}
                                className={`text-content text-balance ${Paragraph[1]}`}
                              />
                            )
                          } else if (value.type === "image") {
                            return <Image key={valueIndex} {...value} />
                          } else if (value.type === "orderedlist") {
                            return <OrderedList key={valueIndex} {...value} />
                          } else if (value.type === "unorderedlist") {
                            return <UnorderedList key={valueIndex} {...value} />
                          } else {
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
