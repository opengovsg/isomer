import { BiRightArrowAlt } from "react-icons/bi"
import { TableOfContentsProps } from "~/common"

const TableOfContents = ({ items }: TableOfContentsProps) => {
  return (
    <div className="flex flex-col gap-3 pl-5 border-l-4 border-content w-[18.75rem]">
      <p className="text-lg text-content-strong font-semibold">On this page</p>
      <div className="flex flex-col gap-3">
        {items.map(({ anchorLink, content }) => (
          <div className="flex flex-row gap-2 items-start">
            <BiRightArrowAlt className="size-6 shrink-0 text-interaction-main" />
            <a
              href={anchorLink}
              className="w-fit text-hyperlink underline underline-offset-2 hover:text-hyperlink-hover active:text-hyperlink"
            >
              {content}
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TableOfContents
