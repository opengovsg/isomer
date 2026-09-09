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
    // w-full because the <li> is a flex container: without it the card is a
    // flex item sized to its own content, so a short step collapses to a
    // narrower box than the grid column it sits in.
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
    // `numeral` is bare (no card), the other two sit inside a bordered card.
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
    // Three to a row is the cap: a Content page only gives a block ~764px, and
    // a fourth column would leave each step too narrow to hold a description.
    // So 4, 5 and 6 wrap to a second row (3 + 1, 3 + 2, 3 + 3) and only a pair
    // gets its own narrower grid. The column count has to be a static class for
    // Tailwind to emit it.
    isPair: {
      true: { stepsContainer: "lg:grid-cols-2" },
    },
    isExternalLink: {
      true: {
        stepButtonIcon: "rotate-[-45deg]",
      },
    },
    // The call to action carries the hover colour, since that's the thing that
    // reads as clickable. The title only takes it when there's no CTA label, in
    // which case the arrow sits beside the title and there is nothing else to
    // highlight.
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

// Numbers are unpadded: the block caps at 6 steps so a leading zero never lines
// anything up, and "step 2" is how the number gets referred to elsewhere on the
// page and said out loud.

export const Steps = ({
  id,
  title,
  subtitle,
  steps,
  numberStyle = "numeral",
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

          {/* An ordered list so screen readers announce the sequence and its
              length; the rendered number is decorative and hidden from them. */}
          <ol className={compoundStyles.stepsContainer({ isPair })}>
            {steps.map(
              ({ title, description, buttonLabel, buttonUrl }, idx) => {
                const hasLink = !!buttonUrl
                const isExternalLink = isExternalUrl(buttonUrl)
                const showTitleArrow = hasLink && !buttonLabel

                return (
                  <li key={idx} className={compoundStyles.step()}>
                    <Link
                      href={getReferenceLinkHref(
                        buttonUrl,
                        site.siteMapArray,
                        site.assetsBaseUrl,
                      )}
                      className={compoundStyles.stepLink({ numberStyle })}
                      isExternal={isExternalLink}
                    >
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
                            className={compoundStyles.stepButtonIcon({
                              isExternalLink,
                            })}
                          />
                        </div>
                      )}
                    </Link>
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
