import type { StepsProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { getHeadingTag } from "~/utils/getHeadingTag"
import { getTailwindVariantLayout } from "~/utils/getTailwindVariantLayout"

import {
  contentBlockIndexAttr,
  type ContentBlockIndexProps,
} from "../../../render/contentBlockIndex"
import { ComponentContent } from "../../internal/customCssClass"
import { Step } from "./Step"

const createStepsStyles = tv({
  slots: {
    section: "bg-white",
    outerContainer: `${ComponentContent}`,
    innerContainer: "flex flex-col gap-12",
    header: "flex w-full max-w-[47.5rem] flex-col items-start text-left",
    headerTitle: "prose-display-sm break-words text-base-content-strong",
    headerSubtitle: "prose-headline-lg-regular text-base-content",
    list: "grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2 lg:grid-cols-3",
  },
  variants: {
    layout: {
      homepage: {
        outerContainer: "py-12 first:pt-0 md:py-16",
        header: "gap-2.5",
        headerSubtitle: "prose-headline-lg-regular",
      },
      default: {
        outerContainer: "mt-14 first:mt-0",
        header: "gap-6",
        headerSubtitle: "prose-body-base",
      },
    },
    // Cap at 3 columns (~764px on Content pages). Four or more steps wrap. Two
    // steps use lg:grid-cols-2. Tailwind needs static class names.
    hasTwo: {
      true: { list: "lg:grid-cols-2" },
    },
  },
  defaultVariants: {
    layout: "default",
  },
})

const styles = createStepsStyles()

type StepsRenderProps = StepsProps & ContentBlockIndexProps

export const Steps = ({
  id,
  title,
  subtitle,
  steps,
  numberStyle,
  layout,
  site,
  headingLevel,
  contentBlockIndex,
}: StepsRenderProps) => {
  const simplifiedLayout = getTailwindVariantLayout(layout)
  const TitleTag = getHeadingTag(headingLevel)
  const hasTwo = steps.length === 2

  return (
    <section
      id={id}
      className={styles.section()}
      {...contentBlockIndexAttr(contentBlockIndex)}
    >
      <div className={styles.outerContainer({ layout: simplifiedLayout })}>
        <div className={styles.innerContainer()}>
          <div className={styles.header({ layout: simplifiedLayout })}>
            <TitleTag className={styles.headerTitle()}>{title}</TitleTag>

            {subtitle && (
              <p
                className={styles.headerSubtitle({
                  layout: simplifiedLayout,
                })}
              >
                {subtitle}
              </p>
            )}
          </div>

          <ol className={styles.list({ hasTwo })}>
            {steps.map((step, index) => (
              <Step
                key={index}
                {...step}
                index={index}
                numberStyle={numberStyle}
                headingLevel={headingLevel + 1}
                site={site}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
