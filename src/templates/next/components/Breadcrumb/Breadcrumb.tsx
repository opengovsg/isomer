import BreadcrumbProps from "~/common/Breadcrumb"
import { MdChevronRight } from "react-icons/md"

const Breadcrumb = ({ links }: BreadcrumbProps) => {
  return (
    <div className="flex flex-row flex-wrap gap-1">
      {links.map((link, index) => {
        const isCurr = index === links.length - 1
        return (
          <div
            key={index}
            className="flex flex-row gap-1 items-center text-content-medium"
          >
            <a
              href={link.url}
              className={`${
                isCurr
                  ? "text-content font-semibold"
                  : "underline underline-offset-2"
              }`}
            >
              {link.title}
            </a>
            {!isCurr && <MdChevronRight className="min-w-6 h-auto" />}
          </div>
        )
      })}
    </div>
  )
}

export default Breadcrumb
