import type { ListItemProps } from "./ListItem"
import type { OrderedListProps } from "./OrderedList"

export interface UnorderedListProps {
  type: "unorderedlist"
  content: (ListItemProps | OrderedListProps | UnorderedListProps)[]
}
