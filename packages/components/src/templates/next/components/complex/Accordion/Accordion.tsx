import { BiChevronDown } from "react-icons/bi"
import type { AccordionProps } from "~/interfaces"
import { Prose } from "../../native"

const Accordion = ({ summary, details }: AccordionProps) => {
  return (
    <details className="border-y border-divider-medium hover:cursor-pointer has-[+_details]:border-b-0 [&_>_summary]:open:font-semibold [&_>_summary_>_svg]:open:rotate-180">
      <summary className="text-paragraph-01 my-[0.125rem] flex list-none flex-row gap-3 px-4 py-5 text-content outline-none focus:ring-2 focus:ring-focus-outline focus:ring-offset-0">
        {summary}
        <BiChevronDown className="mb-auto ml-auto min-w-6 text-2xl transition-all duration-200 ease-in-out" />
      </summary>

      <div className="mb-4 ml-4 mr-6 mt-2">
        <Prose content={details} />
      </div>
    </details>
  )
}

export default Accordion
