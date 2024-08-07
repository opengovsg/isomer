import { BiChevronRight } from "react-icons/bi"

import type { BreadcrumbProps } from "~/interfaces"
import { tv } from "~/lib/tv"

const breadcrumbStyles = tv({
  slots: {
    nav: "flex flex-row flex-wrap items-center gap-2 text-base-content",
    container:
      "prose-label-md-regular flex flex-row items-center gap-1 last:prose-label-md-medium last:text-base-content-medium",
    link: "underline decoration-transparent underline-offset-4 transition hover:decoration-inherit active:text-interaction-link-active",
    icon: "h-5 w-5 flex-shrink-0 text-base-content-subtle",
  },
})

const compoundStyles = breadcrumbStyles()

const Breadcrumb = ({ links, LinkComponent = "a" }: BreadcrumbProps) => {
  const [root, ...rest] = links
  return (
    <nav aria-label="Breadcrumb">
      <ol role="list" className={compoundStyles.nav()}>
        {root && (
          <li className={compoundStyles.container()}>
            <LinkComponent href={root.url} className={compoundStyles.link()}>
              {root.title}
            </LinkComponent>
          </li>
        )}
        {rest.map((link, index) => {
          return (
            <li key={index} className={compoundStyles.container()}>
              <BiChevronRight
                aria-hidden="true"
                className={compoundStyles.icon()}
              />
              <LinkComponent href={link.url} className={compoundStyles.link()}>
                {link.title}
              </LinkComponent>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumb
