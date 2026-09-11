import type { StepsProps } from "~/interfaces"
import { BiRightArrowAlt } from "react-icons/bi"
import { tv } from "~/lib/tv"
import { getHeadingTag } from "~/utils/getHeadingTag"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"
import { getTailwindVariantLayout } from "~/utils/getTailwindVariantLayout"
import { isExternalUrl } from "~/utils/isExternalUrl"
import { groupFocusVisibleHighlight } from "~/utils/tailwind"

import { ComponentContent } from "../../internal/customCssClass"
import { Link } from "../../internal/Link"

const createStepsStyles = tv({
  slots: {
    section: "bg-white",
    outerContainer: `${ComponentContent}`,
    innerContainer: "flex flex-col gap-12",
    header: "flex w-full max-w-[47.5rem] flex-col items-start text-left",
    headerTitle: "prose-display-sm break-words text-base-content-strong",
    headerSubtitle: "prose-headline-lg-regular text-base-content",
    stepsContainer:
      "grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2 lg:grid-cols-3",
    step: "flex",
    // stepLink needs w-full. As a flex child of <li>, a short step shrinks to
    // its content width instead of filling the grid column.
    stepLink:
      "group flex h-full w-full flex-col items-start gap-3 text-left outline-0",
    stepNumber: "text-base-content-subtle",
    stepTitle: [
      groupFocusVisibleHighlight(),
      "prose-headline-lg-semibold text-base-content-strong",
    ],
    stepDescription: "prose-body-base text-base-content",
    stepButton:
      "prose-headline-base-medium inline-flex items-center gap-1 pt-1 text-base-content-strong group-hover:text-brand-interaction",
    stepButtonIcon:
      "mb-0.5 ml-1 inline text-[1.375rem] transition ease-in group-hover:translate-x-1",
  },
  variants: {
    layout: {
      homepage: {
        outerContainer: "py-12 md:py-16",
        header: "gap-2.5",
        headerSubtitle: "prose-headline-lg-regular",
      },
      default: {
        outerContainer: "mt-14",
        header: "gap-6",
        headerSubtitle: "prose-body-base",
      },
    },
    // numeral has no card border. eyebrow and badge do.
    numberStyle: {
      numeral: {
        stepNumber: "prose-display-md text-base-content-strong",
      },
      eyebrow: {
        stepLink: "rounded-lg border border-base-divider-medium p-6",
        stepNumber: "prose-headline-base-medium",
      },
      badge: {
        stepLink: "rounded-lg border border-base-divider-medium p-6",
        stepNumber:
          "prose-display-xs flex h-11 w-11 items-center justify-center rounded-md bg-brand-canvas text-base-content-strong",
      },
    },
    // Cap at 3 columns (~764px on Content pages). Four or more steps wrap. Two
    // steps use lg:grid-cols-2. Tailwind needs static class names.
    isPair: {
      true: { stepsContainer: "lg:grid-cols-2" },
    },
    isExternalLink: {
      true: {
        stepButtonIcon: "rotate-[-45deg]",
      },
    },
    // Hover colour on the CTA. Without a CTA label, the title gets it because
    // the arrow sits there.
    hasTitleArrow: {
      true: {
        stepTitle: "group-hover:text-brand-interaction",
      },
    },
  },
  defaultVariants: {
    layout: "default",
    numberStyle: "numeral",
  },
})

const compoundStyles = createStepsStyles()

export const Steps = ({
  id,
  title,
  subtitle,
  steps,
  numberStyle,
  layout,
  site,
  headingLevel,
}: StepsProps) => {
  const simplifiedLayout = getTailwindVariantLayout(layout)
  const TitleTag = getHeadingTag(headingLevel)
  const StepTitleTag = getHeadingTag(headingLevel + 1)
  const isPair = steps.length === 2

  return (
    <section id={id} className={compoundStyles.section()}>
      <div
        className={compoundStyles.outerContainer({ layout: simplifiedLayout })}
      >
        <div className={compoundStyles.innerContainer()}>
          <div className={compoundStyles.header({ layout: simplifiedLayout })}>
            <TitleTag className={compoundStyles.headerTitle()}>
              {title}
            </TitleTag>

            {subtitle && (
              <p
                className={compoundStyles.headerSubtitle({
                  layout: simplifiedLayout,
                })}
              >
                {subtitle}
              </p>
            )}
          </div>

          <ol className={compoundStyles.stepsContainer({ isPair })}>
            {steps.map(
              ({ title, description, buttonLabel, buttonUrl }, idx) => {
                const href = getReferenceLinkHref(
                  buttonUrl,
                  site.siteMapArray,
                  site.assetsBaseUrl,
                )
                const hasLink = !!href
                const isExternalLink = isExternalUrl(href)
                const showTitleArrow = hasLink && !buttonLabel
                const stepLinkClassName = compoundStyles.stepLink({
                  numberStyle,
                })

                const stepContent = (
                  <>
                    <span
                      aria-hidden
                      className={compoundStyles.stepNumber({ numberStyle })}
                    >
                      {idx + 1}
                    </span>

                    <StepTitleTag
                      className={compoundStyles.stepTitle({
                        hasTitleArrow: showTitleArrow,
                      })}
                    >
                      {title}
                      {showTitleArrow && (
                        <BiRightArrowAlt
                          aria-hidden
                          className={compoundStyles.stepButtonIcon({
                            isExternalLink,
                          })}
                        />
                      )}
                    </StepTitleTag>

                    {description && (
                      <p className={compoundStyles.stepDescription()}>
                        {description}
                      </p>
                    )}

                    {hasLink && !showTitleArrow && (
                      <div className={compoundStyles.stepButton()}>
                        {buttonLabel}
                        <BiRightArrowAlt
                          aria-hidden
                          className={compoundStyles.stepButtonIcon({
                            isExternalLink,
                          })}
                        />
                      </div>
                    )}
                  </>
                )

                return (
                  <li key={idx} className={compoundStyles.step()}>
                    {href ? (
                      <Link
                        href={href}
                        className={stepLinkClassName}
                        isExternal={isExternalLink}
                      >
                        {stepContent}
                      </Link>
                    ) : (
                      <div className={stepLinkClassName}>{stepContent}</div>
                    )}
                  </li>
                )
              },
            )}
          </ol>
        </div>
      </div>
    </section>
  )
}
