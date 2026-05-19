import type { RelatedLinksProps } from "~/interfaces"
import { BiChevronRight } from "react-icons/bi"

import { ComponentContent } from "../../internal/customCssClass"
import { Link } from "../../internal/Link"

const MAX_RELATED_LINKS = 7

export const RelatedLinks = ({ heading = "Related links", links }: RelatedLinksProps) => {
  return (
    <section className={`${ComponentContent} [&:not(:first-child)]:mt-7`}>
      <div className="rounded-lg border border-base-divider bg-base-canvas-alt px-5 py-4">
        <h2 className="prose-headline-lg-medium text-base-content-default">
          {heading}
        </h2>

        <ul className="mt-3 flex flex-col gap-3">
          {links.slice(0, MAX_RELATED_LINKS).map(({ title, url }, index) => (
            <li key={`${title}-${index}`}>
              <Link
                href={url}
                isWithFocusVisibleHighlight
                className="group prose-body-base inline-flex items-center gap-1 text-base-content-default hover:text-brand-interaction"
              >
                <span className="line-clamp-2">{title}</span>
                <BiChevronRight
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 transition group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
