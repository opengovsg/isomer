import type { ButtonProps } from "~/interfaces"
import { BUTTON_VARIANT } from "~/interfaces/complex/Button"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import { LinkButton } from "../../internal/LinkButton"

const ALIGNMENT_STYLES = {
  left: "justify-start",
  center: "justify-center",
} as const

export const Button = (props: ButtonProps) => {
  const { alignment, buttonLabel, buttonUrl, site } = props

  return (
    <div
      className={`flex flex-wrap items-center gap-5 [&:not(:first-child)]:mt-7 ${ALIGNMENT_STYLES[alignment]}`}
    >
      <LinkButton
        href={getReferenceLinkHref(
          buttonUrl,
          site.siteMapArray,
          site.assetsBaseUrl,
        )}
        size="base"
        variant="solid"
      >
        {buttonLabel}
      </LinkButton>

      {props.variant === BUTTON_VARIANT.pair && (
        <LinkButton
          href={getReferenceLinkHref(
            props.secondaryButtonUrl,
            site.siteMapArray,
            site.assetsBaseUrl,
          )}
          size="base"
          variant="outline"
        >
          {props.secondaryButtonLabel}
        </LinkButton>
      )}
    </div>
  )
}
