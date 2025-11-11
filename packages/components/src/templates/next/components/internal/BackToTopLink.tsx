import { BiUpArrowAlt } from "react-icons/bi"

import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { focusVisibleHighlight } from "~/utils"

const linkStyle = tv({
  extend: focusVisibleHighlight,
  base: "prose-body-base sticky top-8 mb-8 mt-16 inline-flex items-center text-link underline-offset-4 first:mt-0 hover:underline",
})

interface BackToTopLinkProps {
  className?: string
}

export const BackToTopLink = ({
  className,
}: BackToTopLinkProps): JSX.Element => {
  return (
    // Using default <a> tag instead of next/link
    // Because next/link for root anchor tags does not work when
    // we do <link preconnect> in the head
    <a href="#" className={twMerge(linkStyle(), className)}>
      <BiUpArrowAlt aria-hidden className="h-6 w-6" />
      Back to top
    </a>
  )
}
