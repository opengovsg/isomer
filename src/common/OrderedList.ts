import type UnorderedListProps from "./UnorderedList"

export interface OrderedListProps {
  _kind: "OrderedList"
  start: number
  items: (string | OrderedListProps | UnorderedListProps)[]
}

export default OrderedListProps
