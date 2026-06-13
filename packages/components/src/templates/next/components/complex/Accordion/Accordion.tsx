import type { VariantProps } from "tailwind-variants"
import type { AccordionProps as BaseAccordionProps } from "~/interfaces/complex/Accordion"
import { BiMinus, BiPlus } from "react-icons/bi"
import { tv } from "~/lib/tv"
import { focusVisibleHighlight } from "~/utils/tailwind"

import { Prose } from "../../native/Prose"

const summaryStyle = tv({
  extend: focusVisibleHighlight,
  base: "prose-headline-lg-medium text-base-content-strong flex list-none flex-row items-center justify-between gap-3 hover:cursor-pointer",
})

const createAccordionStyles = tv({
  slots: {
    details:
      "group border-divider-medium mt-7 border-y px-4 py-5 first:mt-0 has-[+_details]:border-b-0 [&+details]:mt-0",
    icon: "h-6 w-6 shrink-0 [&.minus]:hidden [&.minus]:group-open:block [&.plus]:block [&.plus]:group-open:hidden",
    content: "text-base-content-strong pt-5",
  },
})

const accordionStyles = createAccordionStyles()

interface AccordionProps
  extends BaseAccordionProps, VariantProps<typeof createAccordionStyles> {}

export const Accordion = ({ summary, details, site }: AccordionProps) => {
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
        <Prose {...details} site={site} />
      </div>
    </details>
  )
}
