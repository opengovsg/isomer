import { MdChevronRight } from "react-icons/md"
import type { BreadcrumbProps } from "~/interfaces"

const Breadcrumb = ({ links, LinkComponent = "a" }: BreadcrumbProps) => {
  return (
    <div className="flex flex-row flex-wrap gap-1">
      {links.map((link, index) => {
        const isLast = index === links.length - 1
        return (
          <div
            key={index}
            className="text-content-medium flex flex-row items-center gap-1"
          >
            <LinkComponent
              href={link.url}
              className="hover:text-hyperlink-hover active:text-hyperlink underline underline-offset-2"
            >
              {link.title}
            </LinkComponent>
            {!isLast && <MdChevronRight className="h-auto min-w-6" />}
          </div>
        )
      })}
    </div>
  )
}

export default Breadcrumb
