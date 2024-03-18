import { BiRightArrowAlt } from "react-icons/bi"
import { TableOfContentsProps } from "~/common"

const TableOfContents = ({ headings }: TableOfContentsProps) => {
  return (
    <div className="flex flex-col gap-3 pl-5 border-l-4 border-content w-[18.75rem]">
      <p className="text-lg text-content-strong font-semibold">On this page</p>
      <div className="flex flex-col gap-3">
        {headings.map((heading) => (
          <div className="flex flex-row gap-2 items-start">
            <BiRightArrowAlt className="size-6 shrink-0 text-interaction-main" />
            <a
              href={heading.anchorLink}
              className="text-hyperlink underline w-fit"
            >
              {heading.content}
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TableOfContents
