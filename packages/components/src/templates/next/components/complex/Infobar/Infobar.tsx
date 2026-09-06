import type { InfobarProps } from "~/interfaces/complex/Infobar"
import { DynamicHeading } from "~/utils/DynamicHeading"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"
import { getTailwindVariantLayout } from "~/utils/getTailwindVariantLayout"

import { LinkButton } from "../../internal/LinkButton"
import { createInfobarStyles } from "./infobarStyles"

export const Infobar = ({
  variant,
  title,
  description,
  buttonLabel,
  buttonUrl,
  secondaryButtonLabel,
  secondaryButtonUrl,
  layout,
  site,
  headingLevel,
}: InfobarProps) => {
  const simplifiedLayout = getTailwindVariantLayout(layout)
  const hasPrimaryCTA = !!buttonLabel && !!buttonUrl
  const hasSecondaryCTA = !!secondaryButtonLabel && !!secondaryButtonUrl

  const styles = createInfobarStyles({
    layout: simplifiedLayout,
    colorScheme: variant,
  })

  // NOTE: Should not have dark mode on non-homepage for now
  const buttonColorScheme =
    simplifiedLayout === "homepage" && variant === "dark"
      ? "inverse"
      : "default"

  return (
    <section className={styles.screenWideOuterContainer()}>
      <div className={styles.outerContainer()}>
        <div className={styles.innerContainer()}>
          <div className={styles.headingContainer()}>
            <DynamicHeading level={headingLevel} className={styles.title()}>
              {title}
            </DynamicHeading>
            {description && (
              <p className={styles.description()}>{description}</p>
            )}
          </div>

          {(hasPrimaryCTA || hasSecondaryCTA) && (
            <div className={styles.buttonContainer()}>
              {hasPrimaryCTA && (
                <LinkButton
                  href={getReferenceLinkHref(
                    buttonUrl,
                    site.siteMapArray,
                    site.assetsBaseUrl,
                  )}
                  size={simplifiedLayout === "homepage" ? "lg" : "base"}
                  colorScheme={buttonColorScheme}
                  isWithFocusVisibleHighlight
                >
                  {buttonLabel}
                </LinkButton>
              )}

              {hasSecondaryCTA && (
                <LinkButton
                  href={getReferenceLinkHref(
                    secondaryButtonUrl,
                    site.siteMapArray,
                    site.assetsBaseUrl,
                  )}
                  size={simplifiedLayout === "homepage" ? "lg" : "base"}
                  variant="outline"
                  colorScheme={buttonColorScheme}
                  isWithFocusVisibleHighlight
                >
                  {secondaryButtonLabel}
                </LinkButton>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
