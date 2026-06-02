import type { TableOfContentsProps } from "~/interfaces"
import { BiMinus } from "react-icons/bi"
import { tv } from "~/lib/tv"
import { focusVisibleHighlight } from "~/utils/tailwind"

import { Link } from "../Link"

const linkStyle = tv({
  extend: focusVisibleHighlight,
  base: "text-link visited:text-link-visited hover:text-link-hover w-fit underline-offset-4 hover:underline",
})

export const TableOfContents = ({ items }: TableOfContentsProps) => {
  return (
    <nav
      aria-label="Table of Contents"
      className="bg-base-canvas-alt flex flex-col gap-3 rounded-lg p-6"
    >
      <p className="prose-headline-lg-medium text-base-content-strong">
        On this page
      </p>
      <ul className="prose-body-base flex flex-col gap-3">
        {items.map(({ anchorLink, content }) => (
          <li className="flex flex-row items-start gap-2" key={anchorLink}>
            <BiMinus className="fill-base-content-strong size-5 shrink-0 self-center" />
            <Link href={anchorLink} className={linkStyle()}>
              {content}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
