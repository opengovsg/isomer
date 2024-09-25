import type { InfobarProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import {
  getReferenceLinkHref,
  getSanitizedLinkHref,
  getTailwindVariantLayout,
} from "~/utils"
import { ComponentContent } from "../../internal/customCssClass"
import { LinkButton } from "../../internal/LinkButton"

const createInfobarStyles = tv({
  slots: {
    outerContainer: `${ComponentContent}`,
    innerContainer: "mx-auto flex flex-col",
    headingContainer: "flex flex-col gap-6",
    title: "break-words",
    description: "text-base-content",
    buttonContainer: "flex flex-col items-center gap-x-5 gap-y-4 sm:flex-row",
  },
  variants: {
    layout: {
      homepage: {
        outerContainer: "mx-6 py-16 sm:mx-10 lg:py-24",
        innerContainer: "items-center gap-9 text-center lg:max-w-3xl",
        headingContainer: "gap-6",
        title: "prose-display-lg text-base-content-strong",
        description: "prose-headline-lg-regular",
      },
      default: {
        outerContainer: "rounded-lg bg-base-canvas-backdrop",
        innerContainer: "gap-7 p-8",
        headingContainer: "gap-4",
        title: "prose-display-sm text-base-content",
        description: "prose-body-base",
      },
    },
  },
  defaultVariants: {
    layout: "homepage",
  },
})

const compoundStyles = createInfobarStyles()

const Infobar = ({
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

  return (
    <section>
      <div
        className={compoundStyles.outerContainer({ layout: simplifiedLayout })}
      >
        <div
          className={compoundStyles.innerContainer({
            layout: simplifiedLayout,
          })}
        >
          <div
            className={compoundStyles.headingContainer({
              layout: simplifiedLayout,
            })}
          >
            <h2 className={compoundStyles.title({ layout: simplifiedLayout })}>
              {title}
            </h2>

            {description && (
              <p
                className={compoundStyles.description({
                  layout: simplifiedLayout,
                })}
              >
                {description}
              </p>
            )}
          </div>

          <div className={compoundStyles.buttonContainer()}>
            {buttonLabel && buttonUrl && (
              <LinkButton
                href={getSanitizedLinkHref(
                  getReferenceLinkHref(buttonUrl, site.siteMap),
                )}
                size={simplifiedLayout === "homepage" ? "lg" : "base"}
                LinkComponent={LinkComponent}
              >
                {buttonLabel}
              </LinkButton>
            )}

            {secondaryButtonLabel && secondaryButtonUrl && (
              <LinkButton
                href={getSanitizedLinkHref(
                  getReferenceLinkHref(secondaryButtonUrl, site.siteMap),
                )}
                size={simplifiedLayout === "homepage" ? "lg" : "base"}
                variant="outline"
                LinkComponent={LinkComponent}
              >
                {secondaryButtonLabel}
              </LinkButton>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Infobar
