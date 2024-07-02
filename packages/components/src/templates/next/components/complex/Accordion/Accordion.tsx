import { BiChevronDown } from "react-icons/bi";

import type { AccordionProps } from "~/interfaces";
import { Prose } from "../../native";

const Accordion = ({ summary, details }: AccordionProps) => {
  return (
    <details className="border-divider-medium border-y hover:cursor-pointer has-[+_details]:border-b-0 [&_>_summary_>_svg]:open:rotate-180">
      <summary className="text-paragraph-01 text-content my-[0.125rem] flex list-none flex-row items-center gap-3 px-4 py-5 font-medium outline-none">
        {summary}
        <BiChevronDown className="ml-auto min-w-6 text-2xl transition-all duration-200 ease-in-out" />
      </summary>

      <div className="mb-4 ml-4 mr-6 mt-2">
        <Prose content={details} />
      </div>
    </details>
  );
};

export default Accordion;
