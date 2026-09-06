"use client"

import { BiUpArrowAlt } from "react-icons/bi"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { focusVisibleHighlight } from "~/utils/tailwind"

const buttonStyle = tv({
  base: "prose-body-base sticky top-8 mb-8 mt-16 inline-flex cursor-pointer items-center text-link underline-offset-4 first:mt-0 hover:underline",
  extend: focusVisibleHighlight,
})

interface BackToTopLinkProps {
  className?: string
}

const handleBackToTopClick = () => {
  window.scrollTo({ top: 0 })
}

export const BackToTopLink = ({
  className,
}: BackToTopLinkProps): React.ReactNode => (
  // "Back to top" scrolls the page — it is an action, not navigation — so it
  // renders a <button> that scrolls in JS. This avoids an <a href="#">, which
  // both mutates the URL (can disrupt the SPA router) and, inside the Studio
  // preview iframe (rendered without a src), resolves against the parent
  // document and loads the whole Studio app into the preview area.

  <button
    type="button"
    className={twMerge(buttonStyle(), className)}
    onClick={handleBackToTopClick}
  >
    <BiUpArrowAlt aria-hidden className="h-6 w-6" />
    Back to top
  </button>
)
