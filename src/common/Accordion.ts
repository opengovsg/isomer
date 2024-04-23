import type ImageProps from "./Image"
import type OrderedListProps from "./OrderedList"
import type TableProps from "./Table"
import type UnorderedListProps from "./UnorderedList"

interface AccordionItem {
  summary: string
  details: (
    | ImageProps
    | OrderedListProps
    | string
    | UnorderedListProps
    | TableProps
  )[]
}

export interface AccordionProps extends AccordionItem {
  type: "accordion"
}

export default AccordionProps
