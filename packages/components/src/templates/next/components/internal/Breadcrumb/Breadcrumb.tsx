import { MdChevronRight } from "react-icons/md"

import type { BreadcrumbProps } from "~/interfaces"

const Breadcrumb = ({ links, LinkComponent = "a" }: BreadcrumbProps) => {
  return (
    <div className="flex flex-row flex-wrap gap-2">
      {links.map((link, index) => {
        const isLast = index === links.length - 1
        return (
          <div key={index} className="flex flex-row items-center gap-1">
            <LinkComponent
              href={link.url}
              className={`text-sm underline decoration-transparent underline-offset-2 transition duration-150 ease-in hover:decoration-inherit active:text-hyperlink ${
                isLast ? "font-medium text-gray-700" : "text-gray-600"
              }`}
            >
              {link.title}
            </LinkComponent>
            {!isLast && (
              <MdChevronRight className="h-auto min-w-6 text-gray-400" />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default Breadcrumb
