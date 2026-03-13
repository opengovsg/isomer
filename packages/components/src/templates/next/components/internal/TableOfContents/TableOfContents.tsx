import { BiMinus } from "react-icons/bi"

import type { TableOfContentsProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { focusVisibleHighlight } from "~/utils/tailwind"
import { Link } from "../Link"

const linkStyle = tv({
  extend: focusVisibleHighlight,
  base: "w-fit text-link underline-offset-4 visited:text-link-visited hover:text-link-hover hover:underline",
})

export const TableOfContents = ({
  items,
  LinkComponent,
}: TableOfContentsProps) => {
  return (
    <nav
      aria-label="Table of Contents"
      className="flex flex-col gap-3 rounded-lg bg-base-canvas-alt p-6"
    >
      <p className="prose-headline-lg-medium text-base-content-strong">
        On this page
      </p>
      <ul className="prose-body-base flex flex-col gap-3">
        {items.map(({ anchorLink, content }) => (
          <li className="flex flex-row items-start gap-2" key={anchorLink}>
            <BiMinus className="size-5 shrink-0 self-center fill-base-content-strong" />
            <Link
              href={anchorLink}
              LinkComponent={LinkComponent}
              className={linkStyle()}
            >
              {content}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
