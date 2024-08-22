import { BiChevronRight } from "react-icons/bi"

import type { BreadcrumbProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { Link } from "../Link"

const breadcrumbStyles = tv({
  slots: {
    nav: "flex flex-row flex-wrap items-center gap-1 text-base-content",
    container:
      "prose-label-md-regular flex flex-row items-center gap-1 last:prose-label-md-medium last:text-base-content-medium",
    link: "underline decoration-transparent underline-offset-4 transition active:text-interaction-link-active hover:decoration-inherit",
    icon: "h-5 w-5 flex-shrink-0 text-base-content-subtle",
  },
})

const compoundStyles = breadcrumbStyles()

const Breadcrumb = ({ links, LinkComponent = "a" }: BreadcrumbProps) => {
  const [root, ...rest] = links
  const last = rest.pop()
  return (
    <nav aria-label="Breadcrumb">
      <ol role="list" className={compoundStyles.nav()}>
        {root && (
          <li className={compoundStyles.container()}>
            <Link
              LinkComponent={LinkComponent}
              href={root.url}
              className={compoundStyles.link()}
            >
              {root.title}
            </Link>
            {
              // Edge case, if there is only one child link in the breadcrumb
              last && rest.length === 0 && (
                <BiChevronRight
                  aria-hidden="true"
                  className={compoundStyles.icon()}
                />
              )
            }
          </li>
        )}
        {rest.map((link, index) => {
          return (
            <li key={index} className={compoundStyles.container()}>
              <BiChevronRight
                aria-hidden="true"
                className={compoundStyles.icon()}
              />
              <Link
                LinkComponent={LinkComponent}
                href={link.url}
                className={compoundStyles.link()}
              >
                {link.title}
              </Link>
              {last && index === rest.length - 1 && (
                <BiChevronRight
                  aria-hidden="true"
                  className={compoundStyles.icon()}
                />
              )}
            </li>
          )
        })}
        {last && (
          <li className={compoundStyles.container()}>
            <span>{last.title}</span>
          </li>
        )}
      </ol>
    </nav>
  )
}

export default Breadcrumb
