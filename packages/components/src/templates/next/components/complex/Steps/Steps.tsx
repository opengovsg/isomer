"use client"

import type { VariantProps } from "tailwind-variants"
import type { StepsProps as BaseStepsProps } from "~/interfaces/complex/Steps"
import { useState } from "react"
import { STEP_TYPE } from "~/interfaces/complex/Steps"
import { tv } from "~/lib/tv"
import { focusVisibleHighlight } from "~/utils/tailwind"

import { Prose } from "../../native/Prose"

const expandButtonStyle = tv({
  extend: focusVisibleHighlight,
  base: "prose-label-md-medium mt-2 inline-flex items-center gap-1 text-link hover:text-link-hover",
})

const createStepsStyles = tv({
  slots: {
    container: "[&:not(:first-child)]:mt-7",
    heading: "mb-6 flex flex-col gap-2.5",
    title: "prose-display-xs text-base-content-strong",
    description: "prose-body-base text-base-content",
    list: "flex flex-col",
    stepWrapper: "flex flex-col",
    badgeRow: "flex items-center gap-3 py-3",
    badge:
      "prose-label-sm-medium flex h-6 items-center rounded-full px-3 uppercase text-base-content-strong",
    badgeLine: "h-px flex-1 bg-base-divider-medium",
    stepRow: "flex gap-4",
    connector: "flex flex-col items-center",
    numberBadge:
      "prose-label-md-medium flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-canvas-inverse text-base-content-inverse",
    connectorLine: "mt-1 w-0.5 flex-1 bg-base-divider-medium",
    stepContent: "flex flex-col gap-2 pb-6",
    instruction: "prose-headline-lg-medium text-base-content-strong",
    stepDescription: "prose-body-base text-base-content",
    image: "mt-3 w-full max-w-sm rounded-lg object-cover",
  },
})

const stepsStyles = createStepsStyles()

interface StepDescriptionProps {
  description: NonNullable<BaseStepsProps["steps"][number]["description"]>
  site: BaseStepsProps["site"]
}

const StepDescription = ({ description, site }: StepDescriptionProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const paragraphs = description.content?.filter(
    (block) => block.type === "paragraph",
  )
  const hasManyParagraphs = paragraphs && paragraphs.length > 3
  const shouldTruncate = hasManyParagraphs && !isExpanded

  const truncatedContent = shouldTruncate
    ? {
        ...description,
        content: description.content?.slice(0, 3),
      }
    : description

  return (
    <div>
      <Prose {...truncatedContent} site={site} />
      {hasManyParagraphs && (
        <button
          className={expandButtonStyle()}
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  )
}

interface StepsProps
  extends BaseStepsProps, VariantProps<typeof createStepsStyles> {}

export const Steps = ({ title, description, steps, site }: StepsProps) => {
  let stepNumber = 0

  return (
    <section className={stepsStyles.container()}>
      {(title || description) && (
        <div className={stepsStyles.heading()}>
          {title && <h2 className={stepsStyles.title()}>{title}</h2>}
          {description && (
            <p className={stepsStyles.description()}>{description}</p>
          )}
        </div>
      )}
      <ol className={stepsStyles.list()}>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1

          if (
            step.stepType === STEP_TYPE.or ||
            step.stepType === STEP_TYPE.and
          ) {
            return (
              <li key={index} className={stepsStyles.stepWrapper()}>
                <div className={stepsStyles.badgeRow()}>
                  <div className={stepsStyles.badgeLine()} />
                  <span className={stepsStyles.badge()}>
                    {step.stepType === STEP_TYPE.or ? "Or" : "And"}
                  </span>
                  <div className={stepsStyles.badgeLine()} />
                </div>
              </li>
            )
          }

          stepNumber += 1
          const currentNumber = stepNumber

          return (
            <li key={index} className={stepsStyles.stepWrapper()}>
              <div className={stepsStyles.stepRow()}>
                <div className={stepsStyles.connector()}>
                  <div aria-hidden className={stepsStyles.numberBadge()}>
                    {currentNumber}
                  </div>
                  {!isLast && (
                    <div aria-hidden className={stepsStyles.connectorLine()} />
                  )}
                </div>
                <div className={stepsStyles.stepContent()}>
                  <h3 className={stepsStyles.instruction()}>
                    {step.instruction}
                  </h3>
                  {step.description && (
                    <StepDescription
                      description={step.description}
                      site={site}
                    />
                  )}
                  {step.imageSrc && step.imageAlt && (
                    <img
                      src={step.imageSrc}
                      alt={step.imageAlt}
                      className={stepsStyles.image()}
                    />
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
