import type { InfobarProps } from "~/interfaces"
import { DEFAULT_INFOBAR_VARIANT } from "~/interfaces"
import { tv } from "~/lib/tv"
import { getReferenceLinkHref, getTailwindVariantLayout } from "~/utils"
import { ComponentContent } from "../../internal/customCssClass"
import { LinkButton } from "../../internal/LinkButton"

export const createInfobarStyles = tv({
  slots: {
    screenWideOuterContainer: "",
    outerContainer: `${ComponentContent}`,
    innerContainer: "mx-auto flex flex-col items-start",
    headingContainer: "flex flex-col gap-6",
    title: "break-words",
    description: "",
    buttonContainer: "flex flex-col gap-x-5 gap-y-4 sm:flex-row",
  },
  variants: {
    layout: {
      homepage: {
        outerContainer: "mx-6 py-16 sm:mx-10 lg:py-24",
        innerContainer: "items-center gap-9 text-center lg:max-w-3xl",
        headingContainer: "gap-6",
        title: "prose-display-lg",
        description: "prose-headline-lg-regular",
        buttonContainer: "items-center",
      },
      default: {
        screenWideOuterContainer: "mt-12 first:mt-0",
        outerContainer: "rounded-lg",
        innerContainer: "items-start gap-7 p-8",
        headingContainer: "gap-4",
        title: "prose-display-sm",
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
        outerContainer: "bg-base-canvas-backdrop",
      },
    },
    {
      colorScheme: "light",
      layout: "homepage",
      className: {
        outerContainer: "text-base-content-strong",
      },
    },
    {
      colorScheme: "light",
      layout: "default",
      className: {
        screenWideOuterContainer: "bg-base-canvas-backdrop",
        outerContainer: "bg-base-canvas-backdrop",
      },
    },
  ],
  defaultVariants: {
    layout: "homepage",
    colorScheme: DEFAULT_INFOBAR_VARIANT,
  },
})

const Infobar = ({
  variant,
  title,
  description,
  buttonLabel,
  buttonUrl,
  secondaryButtonLabel,
  secondaryButtonUrl,
  layout,
  site,
  LinkComponent,
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
                    site.siteMap,
                    site.assetsBaseUrl,
                  )}
                  size={simplifiedLayout === "homepage" ? "lg" : "base"}
                  colorScheme={buttonColorScheme}
                  LinkComponent={LinkComponent}
                  isWithFocusVisibleHighlight
                >
                  {buttonLabel}
                </LinkButton>
              )}

              {hasSecondaryCTA && (
                <LinkButton
                  href={getReferenceLinkHref(
                    secondaryButtonUrl,
                    site.siteMap,
                    site.assetsBaseUrl,
                  )}
                  size={simplifiedLayout === "homepage" ? "lg" : "base"}
                  variant="outline"
                  colorScheme={buttonColorScheme}
                  LinkComponent={LinkComponent}
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

export default Infobar
