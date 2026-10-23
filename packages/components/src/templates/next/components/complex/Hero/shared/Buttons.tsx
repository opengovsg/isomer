import type { HeroActionLayoutButtonsPanelProps } from "~/interfaces/complex/Hero"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import { LinkButton } from "../../../internal/LinkButton/LinkButton"

export const Buttons = ({
  buttonLabel,
  buttonUrl,
  secondaryButtonLabel,
  secondaryButtonUrl,
  site,
}: HeroActionLayoutButtonsPanelProps) => {
  if (!buttonLabel || !buttonUrl) {
    return null
  }

  return (
    <div className="flex flex-col justify-start gap-x-5 gap-y-4 sm:flex-row">
      <LinkButton
        href={getReferenceLinkHref(
          buttonUrl,
          site.siteMapArray,
          site.assetsBaseUrl,
        )}
        size="lg"
        isWithFocusVisibleHighlight
      >
        {buttonLabel}
      </LinkButton>
      {secondaryButtonLabel && secondaryButtonUrl ? (
        <LinkButton
          colorScheme="inverse"
          variant="outline"
          size="lg"
          href={getReferenceLinkHref(
            secondaryButtonUrl,
            site.siteMapArray,
            site.assetsBaseUrl,
          )}
          isWithFocusVisibleHighlight
        >
          {secondaryButtonLabel}
        </LinkButton>
      ) : null}
    </div>
  )
}
