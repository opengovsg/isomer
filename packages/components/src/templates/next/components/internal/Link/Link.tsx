"use client"

import type { LinkProps } from "~/interfaces/internal/Link"
import { BiRightArrowAlt } from "react-icons/bi"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { useLinkComponent } from "~/templates/next/context/LinkComponentContext"
import { focusRing, focusVisibleHighlight } from "~/utils/tailwind"

const linkStyles = tv({
  extend: focusRing,
  base: "",
})

const fvHighlightLinkStyles = tv({
  extend: focusVisibleHighlight,
  base: "outline-none outline-0",
})

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
  const LinkComponent = useLinkComponent()
  const cssStyles = twMerge(
    isWithFocusVisibleHighlight ? fvHighlightLinkStyles() : linkStyles(),
    className,
  )
  const externalLinkProps = isExternal
    ? { target: "_blank", rel: "noopener nofollow" }
    : {}
  const ElementToRender = href ? (LinkComponent ?? "a") : "span"

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
      {/* SVG, not "↗": Windows falls back to Segoe UI Emoji and renders a blue emoji tile.
          Rotated BiRightArrowAlt so the stroke matches the navbar's right arrow;
          negative margin trims viewBox padding to keep the old glyph's spacing. */}
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
