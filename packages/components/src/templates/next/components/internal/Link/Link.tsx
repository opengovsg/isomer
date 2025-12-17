import type { LinkProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { focusRing, focusVisibleHighlight } from "~/utils"
import { ExternalLinkIcon } from "../../native/ExternalLinkIcon"
import { getReactNodeText } from "./utils"
import { generateAriaLabel } from "./utils/generateAriaLabel"

const linkStyles = tv({
  extend: focusRing,
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
    "inline-flex items-center",
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
        <ExternalLinkIcon className="ml-0.5 size-[1.25em] shrink-0 stroke-current" />
      )}
    </ElementToRender>
  )
}
