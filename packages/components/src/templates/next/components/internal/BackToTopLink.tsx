import { BiUpArrowAlt } from "react-icons/bi"

import type { LinkComponentType } from "~/types"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { focusVisibleHighlight } from "~/utils"
import { Link } from "./Link"

const linkStyle = tv({
  extend: focusVisibleHighlight,
  base: "prose-body-base sticky top-8 mb-8 mt-16 inline-flex items-center text-link underline-offset-4 hover:underline",
})

interface BackToTopLinkProps {
  className?: string
  LinkComponent?: LinkComponentType
}

export const BackToTopLink = ({
  className,
  LinkComponent,
}: BackToTopLinkProps): JSX.Element => {
  return (
    <Link
      href="#"
      className={twMerge(linkStyle(), className)}
      LinkComponent={LinkComponent}
    >
      <BiUpArrowAlt aria-hidden className="h-6 w-6" />
      Back to top
    </Link>
  )
}
