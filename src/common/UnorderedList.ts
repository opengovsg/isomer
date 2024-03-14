import type OrderedListProps from "./OrderedList"

export interface UnorderedListProps {
  _kind: "UnorderedList"
  items: (string | OrderedListProps | UnorderedListProps)[]
}

export default UnorderedListProps
