"use client"

import type { VariantProps } from "tailwind-variants"
import { BiMinus, BiPlus } from "react-icons/bi"

import type { AccordionProps as BaseAccordionProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { focusVisibleHighlightNonRac } from "~/utils/rac"
import { Prose } from "../../native"

const summaryStyle = tv({
  extend: focusVisibleHighlightNonRac,
  base: "prose-headline-lg-medium flex list-none flex-row items-center justify-between gap-3 text-base-content-strong hover:cursor-pointer",
})

const createAccordionStyles = tv({
  slots: {
    details:
      "group border-y border-divider-medium px-4 py-5 has-[+_details]:border-b-0 [&:not(:first-child)]:first-of-type:mt-7",
    icon: "h-6 w-6 flex-shrink-0 [&.minus]:hidden [&.minus]:group-open:block [&.plus]:block [&.plus]:group-open:hidden",
    content: "pt-5 text-base-content-strong",
  },
})

const accordionStyles = createAccordionStyles()

interface AccordionProps
  extends BaseAccordionProps,
    VariantProps<typeof createAccordionStyles> {}

const Accordion = ({ summary, details }: AccordionProps) => {
  return (
    <details className={accordionStyles.details()}>
      <summary className={summaryStyle()}>
        {summary}
        <BiMinus
          aria-hidden
          className={accordionStyles.icon({ className: "minus" })}
        />
        <BiPlus
          aria-hidden
          className={accordionStyles.icon({ className: "plus" })}
        />
      </summary>

      <div className={accordionStyles.content()}>
        <Prose {...details} />
      </div>
    </details>
  )
}

export default Accordion
