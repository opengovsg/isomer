import type { InfobarProps } from "~/interfaces/complex/Infobar"
import { DEFAULT_INFOBAR_VARIANT } from "~/interfaces/complex/Infobar/constants"
import { tv } from "~/lib/tv"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"
import { getTailwindVariantLayout } from "~/utils/getTailwindVariantLayout"

import { ComponentContent } from "../../internal/customCssClass"
import { LinkButton } from "../../internal/LinkButton"

export const createInfobarStyles = tv({
  slots: {
    screenWideOuterContainer: "",
    outerContainer: `${ComponentContent}`,
    innerContainer: "flex-col mx-auto flex items-start",
    headingContainer: "flex-col gap-6 flex",
    title: "break-words",
    description: "",
    buttonContainer: "flex-col gap-y-4 gap-x-5 flex sm:flex-row",
  },
  variants: {
    layout: {
      homepage: {
        outerContainer: "mx-6 py-16 sm:mx-10 lg:py-24",
        innerContainer:
          "gap-9 items-center rounded-none text-center lg:max-w-3xl",
        headingContainer: "gap-6",
        title: "prose-display-lg",
        description: "prose-headline-lg-regular",
        buttonContainer: "items-center",
      },
      default: {
        screenWideOuterContainer: "mt-12 rounded-lg first:mt-0",
        innerContainer: "gap-7 items-start p-8",
        headingContainer: "gap-4",
        title: "prose-display-xs",
        description: "prose-body-base",
        buttonContainer: "items-start",
      },
    },
    colorScheme: {
      dark: {},
      light: {},
    },
  },
  compoundVariants: [
    {
      colorScheme: "dark",
      layout: "homepage",
      className: {
        screenWideOuterContainer: "bg-base-canvas-inverse",
        outerContainer: "bg-base-canvas-inverse text-base-canvas",
      },
    },
    {
      // NOTE: Should not have dark mode on non-homepage for now
      // Copy the light + default variant
      colorScheme: "dark",
      layout: "default",
      className: {
        screenWideOuterContainer: "bg-base-canvas-backdrop",
        outerContainer: "",
      },
    },
    {
      colorScheme: "light",
      layout: "homepage",
      className: {
        outerContainer: "text-base-content-strong",
        description: "text-base-content",
      },
    },
    {
      colorScheme: "light",
      layout: "default",
      className: {
        screenWideOuterContainer: "bg-base-canvas-backdrop",
        outerContainer: "",
      },
    },
  ],
  defaultVariants: {
    layout: "homepage",
    colorScheme: DEFAULT_INFOBAR_VARIANT,
  },
})

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
            <h2 className={styles.title()}>{title}</h2>
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
