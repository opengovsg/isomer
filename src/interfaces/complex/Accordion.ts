import type {
  ImageProps,
  OrderedListProps,
  TableProps,
  UnorderedListProps,
} from "~/interfaces/native"

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
