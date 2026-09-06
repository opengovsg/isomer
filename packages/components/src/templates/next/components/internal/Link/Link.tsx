"use client"

import type { LinkProps } from "~/interfaces/internal/Link"
import { createElement } from "react"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { useLinkComponent } from "~/templates/next/context/LinkComponentContext"
import { focusRing, focusVisibleHighlight } from "~/utils/tailwind"

const linkStyles = tv({
  base: "",
  extend: focusRing,
})

const fvHighlightLinkStyles = tv({
  base: "outline-none outline-0",
  extend: focusVisibleHighlight,
})

// oxlint-disable-next-line react-doctor/no-many-boolean-props -- link presentation flags map to anchor attributes
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
    ? { rel: "noopener nofollow", target: "_blank" }
    : {}
  const ElementToRender = href ? (LinkComponent ?? "a") : "span"

  return createElement(
    ElementToRender,
    {
      ...externalLinkProps,
      ...rest,
      "aria-current": current,
      "aria-label": label
        ? `${label}${isExternal ? " (opens in new tab)" : ""}`
        : undefined,
      className: cssStyles,
      "data-current": !!current || undefined,
      disabled: isDisabled,
      href,
    },
    children,
    showExternalIcon && createElement("span", { "aria-hidden": "true" }, " ↗"),
    isExternal &&
      !label &&
      createElement("span", { className: "sr-only" }, " (opens in new tab)"),
  )
}
