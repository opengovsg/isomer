import type UnorderedListProps from "./UnorderedList"

export interface OrderedListProps {
  type: "orderedlist"
  start: number
  items: (string | OrderedListProps | UnorderedListProps)[]
}

export default OrderedListProps
