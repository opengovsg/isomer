import type { LinkProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { focusRing, focusVisibleHighlight } from "~/utils"
import { getReactNodeText } from "./utils"
import { generateAriaLabel } from "./utils/generateAriaLabel"

const linkStyles = tv({
  extend: focusRing,
  base: "",
  variants: {
    showExternalIcon: {
      true: `after:content-['_↗']`,
    },
  },
})

const fvHighlightLinkStyles = tv({
  extend: focusVisibleHighlight,
  base: "outline-none outline-0",
  variants: {
    showExternalIcon: {
      true: `after:content-['_↗']`,
    },
  },
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
      ? fvHighlightLinkStyles({ showExternalIcon })
      : linkStyles({ showExternalIcon }),
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
    />
  )
}
