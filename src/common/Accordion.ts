import type ImageProps from "./Image"
import type OrderedListProps from "./OrderedList"
import type UnorderedListProps from "./UnorderedList"

interface AccordionItem {
  summary: string
  details: (ImageProps | OrderedListProps | string | UnorderedListProps)[]
}

export interface AccordionProps extends AccordionItem {
  type: "accordion"
}

export default AccordionProps
