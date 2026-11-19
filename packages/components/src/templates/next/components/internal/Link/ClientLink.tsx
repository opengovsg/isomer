"use client"

import type { ElementType } from "react"
import type { LinkProps } from "~/interfaces/internal/Link"
import { BiRightArrowAlt } from "react-icons/bi"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { focusRing, focusVisibleHighlight } from "~/utils/tailwind"

const linkStyles = tv({
  extend: focusRing,
  base: "",
})

const fvHighlightLinkStyles = tv({
  extend: focusVisibleHighlight,
  base: "outline-none outline-0",
})

// Separate module from Link.tsx so server chrome can import native <a>
// without being pulled into the client graph by NavbarClient.
export const Link = ({
  href,
  current,
  isDisabled,
  isExternal,
  isWithFocusVisibleHighlight,
  showExternalIcon,
  className,
  label,
  children,
  ...rest
}: LinkProps) => {
  const cssStyles = twMerge(
    isWithFocusVisibleHighlight ? fvHighlightLinkStyles() : linkStyles(),
    className,
  )
  const externalLinkProps = isExternal
    ? { target: "_blank", rel: "noopener nofollow" }
    : {}
  const ElementToRender = (href ? "a" : "span") as ElementType

  return (
    <ElementToRender
      {...externalLinkProps}
      {...rest}
      href={href}
      className={cssStyles}
      aria-label={
        label ? `${label}${isExternal ? " (opens in new tab)" : ""}` : undefined
      }
      aria-current={current}
      data-current={!!current || undefined}
      disabled={isDisabled}
    >
      {children}
      {showExternalIcon && (
        <BiRightArrowAlt
          aria-hidden="true"
          className="-mr-[0.2em] inline -rotate-45 align-[-0.25em] text-[1.4em]"
        />
      )}
      {isExternal && !label && (
        <span className="sr-only"> (opens in new tab)</span>
      )}
    </ElementToRender>
  )
}
