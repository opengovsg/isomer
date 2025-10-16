import { useId } from "react"

import type { TableProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import BaseParagraph from "../../internal/BaseParagraph"
import Divider from "../Divider"
import OrderedList from "../OrderedList"
import Paragraph from "../Paragraph"
import UnorderedList from "../UnorderedList"

const tableCellStyles = tv({
  base: "max-w-40 break-words border border-base-divider-medium px-4 py-3 align-top [&_li]:mb-4 [&_li]:mt-0 [&_li]:pl-1 [&_ol]:mt-0 [&_ol]:ps-5 [&_ul]:mt-0 [&_ul]:ps-5",
  variants: {
    isHeader: {
      true: "bg-base-canvas-backdrop [&_ol]:prose-label-md-medium [&_p]:prose-label-md-medium",
      false: "bg-base-canvas-alt [&_ol]:prose-body-sm [&_p]:prose-body-sm",
    },
  },
})

const Table = ({
  attrs: { caption },
  content,
  LinkComponent,
  site,
}: TableProps) => {
  const tableDescriptionId = useId()

  return (
    <div className="flex flex-col gap-4 [&:not(:first-child)]:mt-7">
      <BaseParagraph
        id={tableDescriptionId}
        content={caption}
        className="prose-label-md-regular text-base-content-subtle [&:not(:last-child)]:mb-0"
        LinkComponent={LinkComponent}
      />
      <div className="overflow-x-auto" tabIndex={0}>
        <table
          className="w-full border-collapse border-spacing-0 border border-base-divider-medium"
          aria-describedby={tableDescriptionId}
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
                                  LinkComponent={LinkComponent}
                                  site={site}
                                />
                              )
                            case "paragraph":
                              return (
                                <Paragraph
                                  key={index}
                                  {...cellContent}
                                  LinkComponent={LinkComponent}
                                  site={site}
                                />
                              )
                            case "unorderedList":
                              return (
                                <UnorderedList
                                  key={index}
                                  {...cellContent}
                                  LinkComponent={LinkComponent}
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

export default Table
