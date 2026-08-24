import type { ButtonProps } from "~/interfaces"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import { LinkButton } from "../../internal/LinkButton"

const ALIGNMENT_STYLES = {
  left: "justify-start",
  center: "justify-center",
} as const

export const Button = ({
  alignment,
  buttonLabel,
  buttonUrl,
  secondaryButtonLabel,
  secondaryButtonUrl,
  site,
}: ButtonProps) => {
  const hasSecondaryCTA = !!secondaryButtonLabel && !!secondaryButtonUrl

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
        isWithFocusVisibleHighlight
      >
        {buttonLabel}
      </LinkButton>

      {hasSecondaryCTA && (
        <LinkButton
          href={getReferenceLinkHref(
            secondaryButtonUrl,
            site.siteMapArray,
            site.assetsBaseUrl,
          )}
          size="base"
          variant="outline"
          isWithFocusVisibleHighlight
        >
          {secondaryButtonLabel}
        </LinkButton>
      )}
    </div>
  )
}
