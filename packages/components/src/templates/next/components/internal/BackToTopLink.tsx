"use client"

import type { MouseEvent } from "react"
import { BiUpArrowAlt } from "react-icons/bi"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { focusVisibleHighlight } from "~/utils/tailwind"

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
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Scroll to the top in JS rather than relying on the browser's default
    // "#" fragment navigation. Inside the Studio preview iframe (rendered
    // without a src) a bare href="#" resolves against the parent document's
    // URL, which navigates the whole Studio app into the preview area.
    e.preventDefault()
    window.scrollTo({ top: 0 })
  }

  return (
    // Using default <a> tag instead of next/link
    // Because next/link for root anchor tags does not work when
    // we do <link preconnect> in the head
    <a
      href="#"
      className={twMerge(linkStyle(), className)}
      onClick={handleClick}
    >
      <BiUpArrowAlt aria-hidden className="h-6 w-6" />
      Back to top
    </a>
  )
}
