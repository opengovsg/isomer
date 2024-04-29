import type { OrderedListProps } from "./OrderedList"

export interface UnorderedListProps {
  type: "unorderedlist"
  items: (string | OrderedListProps | UnorderedListProps)[]
}

export default UnorderedListProps
