import { useState } from "react"
import { BiMinus, BiPlus } from "react-icons/bi"

import type { AccordionProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { Prose } from "../../native"

const createAccordionStyles = tv({
  slots: {
    details:
      "group border-y border-divider-medium px-4 py-5 has-[+_details]:border-b-0",
    summary:
      "prose-headline-lg-medium flex list-none flex-row items-center justify-between gap-3 text-base-content-strong outline-none outline outline-0 outline-offset-2 outline-brand-interaction hover:cursor-pointer focus-visible:outline-2",
    icon: "h-6 w-6",
    content: "pt-5 text-base-content-strong",
  },
})

const accordionStyles = createAccordionStyles()

const Accordion = ({ summary, details }: AccordionProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const Icon = isOpen ? BiMinus : BiPlus

  return (
    <details
      onToggle={(e) => setIsOpen(e.currentTarget.open)}
      open={isOpen}
      className={accordionStyles.details()}
    >
      <summary className={accordionStyles.summary()}>
        {summary}
        <Icon aria-hidden className={accordionStyles.icon()} />
      </summary>

      <div className={accordionStyles.content()}>
        <Prose {...details} />
      </div>
    </details>
  )
}

export default Accordion
