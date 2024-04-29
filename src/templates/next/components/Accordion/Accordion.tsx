import { BiChevronDown } from "react-icons/bi"
import { AccordionProps } from "~/common"
import BaseParagraph from "../shared/Paragraph"
import { Paragraph } from "../../typography/Paragraph"
import Image from "../Image"
import OrderedList from "../OrderedList"
import UnorderedList from "../UnorderedList"
import Table from "../Table"
import ContentHole from "../../tiptap/ContentHole"

// FIXME: The extra nesting resulted in <summary> not being directly under <details>
// which broke the accordion itself

// export const AccordionSummary = ({
//   NodeViewContent = "summary",
// }: BaseIsomerComponent) => {
//   return (
//     <summary className="my-2 px-4 py-3 flex flex-row gap-3 outline-none list-none text-content focus:ring-2 focus:ring-offset-0 focus:ring-focus-outline">
//       <NodeViewContent as="span" />
//       <BiChevronDown className="ml-auto mb-auto min-w-6 text-2xl transition-all duration-200 ease-in-out" />
//     </summary>
//   )
// }

// export const AccordionDetails = ({
//   NodeViewContent = "div",
// }: BaseIsomerComponent) => {
//   return <NodeViewContent as="div" className="mt-2 mb-4 ml-4 mr-6" />
// }

// const Accordion = ({
//   NodeViewWrapper = "div",
//   NodeViewContent = "details",
// }: AccordionProps) => {
//   return (
//     <NodeViewWrapper as="div">
//       <NodeViewContent
//         as="details"
//         className="[&_>_summary]:open:font-semibold [&_>_summary_>_svg]:open:rotate-180 border-y border-divider-medium"
//       />
//     </NodeViewWrapper>
//   )
// }

const Accordion = ({
  summary,
  content,
  NodeViewWrapper = "details",
  NodeViewContent,
}: AccordionProps) => {
  return (
    <NodeViewWrapper
      as="details"
      className="[&_>_summary]:open:font-semibold [&_>_summary_>_svg]:open:rotate-180 border-y has-[+_details]:border-b-0 border-divider-medium"
    >
      <summary className="my-2 px-4 py-3 flex flex-row gap-3 outline-none list-none text-content focus:ring-2 focus:ring-offset-0 focus:ring-focus-outline">
        {summary}
        <BiChevronDown className="ml-auto mb-auto min-w-6 text-2xl transition-all duration-200 ease-in-out" />
      </summary>

      <div className="mt-2 mb-4 ml-4 mr-6">
        <ContentHole content={content} NodeViewContent={NodeViewContent} />
      </div>
    </NodeViewWrapper>
  )
}

export default Accordion
