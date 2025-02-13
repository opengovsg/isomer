import type { VariantProps } from "tailwind-variants"
import { BiMinus, BiPlus } from "react-icons/bi"

import type { AccordionProps as BaseAccordionProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { focusVisibleHighlight } from "~/utils"
import { Prose } from "../../native"

const summaryStyle = tv({
  extend: focusVisibleHighlight,
  base: "prose-headline-lg-medium flex list-none flex-row items-center justify-between gap-3 text-base-content-strong hover:cursor-pointer",
})

const createAccordionStyles = tv({
  slots: {
    details:
      "group mt-7 border-y border-divider-medium px-4 py-5 first:mt-0 has-[+_details]:border-b-0 [&+details]:mt-0",
    icon: "h-6 w-6 flex-shrink-0 [&.minus]:hidden [&.minus]:group-open:block [&.plus]:block [&.plus]:group-open:hidden",
    content: "pt-5 text-base-content-strong",
  },
})

const accordionStyles = createAccordionStyles()

interface AccordionProps
  extends BaseAccordionProps,
    VariantProps<typeof createAccordionStyles> {}

const Accordion = ({
  summary,
  details,
  LinkComponent,
  site,
}: AccordionProps) => {
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
        <Prose {...details} LinkComponent={LinkComponent} site={site} />
      </div>
    </details>
  )
}

export default Accordion
