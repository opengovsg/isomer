import type ImageProps from "./Image"
import type OrderedListProps from "./OrderedList"
import type ParagraphProps from "./Paragraph"
import type TableProps from "./Table"
import type UnorderedListProps from "./UnorderedList"
import type { BaseIsomerComponent } from "./base"

interface AccordionItem {
  summary: string
  content: (
    | ImageProps
    | OrderedListProps
    | ParagraphProps
    | UnorderedListProps
    | TableProps
  )[]
}

export interface AccordionProps extends AccordionItem, BaseIsomerComponent {
  type: "accordion"
}

export default AccordionProps
