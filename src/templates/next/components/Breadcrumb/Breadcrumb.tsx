import BreadcrumbProps from "~/common/Breadcrumb"
import { MdChevronRight } from "react-icons/md"

const Breadcrumb = ({ links, LinkComponent = "a" }: BreadcrumbProps) => {
  return (
    <div className="flex flex-row flex-wrap gap-1">
      {links.map((link, index) => {
        const isCurr = index === links.length - 1
        return (
          <div
            key={index}
            className="flex flex-row gap-1 items-center text-content-medium"
          >
            {isCurr ? (
              <p className="text-content font-semibold">{link.title}</p>
            ) : (
              <LinkComponent
                href={link.url}
                className="underline underline-offset-2 hover:text-hyperlink-hover active:text-hyperlink"
              >
                {link.title}
              </LinkComponent>
            )}
            {!isCurr && <MdChevronRight className="min-w-6 h-auto" />}
          </div>
        )
      })}
    </div>
  )
}

export default Breadcrumb
