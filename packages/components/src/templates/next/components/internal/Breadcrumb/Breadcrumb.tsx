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
              className={`underline decoration-transparent underline-offset-4 transition duration-150 ease-in hover:decoration-inherit active:text-interaction-link-active ${
                isLast
                  ? "prose-label-md-medium text-base-content-medium"
                  : "text-base-contentcontent prose-label-md-regular"
              }`}
            >
              {link.title}
            </LinkComponent>
            {!isLast && (
              <MdChevronRight className="h-auto min-w-5 fill-base-content-subtle" />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default Breadcrumb
