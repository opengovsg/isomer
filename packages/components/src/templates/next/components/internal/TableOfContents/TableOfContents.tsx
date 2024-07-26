import { BiMinus } from "react-icons/bi"

import type { TableOfContentsProps } from "~/interfaces"

const TableOfContents = ({ items }: TableOfContentsProps) => {
  return (
    <div className="flex flex-col gap-3">
      <p className="prose-headline-lg-medium text-base-content-strong">
        On this page
      </p>
      <div className="prose-body-base flex flex-col gap-3">
        {items.map(({ anchorLink, content }) => (
          <div className="flex flex-row items-start gap-2">
            <BiMinus className="size-5 shrink-0 fill-base-content-strong" />
            <a
              href={anchorLink}
              className="w-fit text-link underline-offset-4 hover:text-link-hover hover:underline"
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
