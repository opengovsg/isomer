import { BiRightArrowAlt } from "react-icons/bi"

import type { LinkProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { focusRing, focusVisibleHighlight } from "~/utils"
import { getReactNodeText } from "./utils"
import { generateAriaLabel } from "./utils/generateAriaLabel"

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
  LinkComponent,
  ...rest
}: LinkProps) => {
  const cssStyles = twMerge(
    isWithFocusVisibleHighlight
      ? fvHighlightLinkStyles()
      : linkStyles(),
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
      aria-label={generateAriaLabel({
        label,
        textContent: getReactNodeText(rest.children),
        isExternal,
      })}
      aria-current={current}
      data-current={!!current || undefined}
      disabled={isDisabled}
    >
      {rest.children}
      {showExternalIcon && (
        <BiRightArrowAlt
          className="ml-1 inline-block rotate-45"
          aria-hidden="true"
        />
      )}
    </ElementToRender>
  )
}
