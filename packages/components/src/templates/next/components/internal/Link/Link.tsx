"use client"

import type { LinkProps } from "~/interfaces/internal/Link"
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
      {showExternalIcon && <span aria-hidden="true"> ↗</span>}
      {isExternal && !label && (
        <span className="sr-only"> (opens in new tab)</span>
      )}
    </ElementToRender>
  )
}
