import type ListItemProps from "./ListItem"
import type OrderedListProps from "./OrderedList"
import type { BaseIsomerComponent } from "./base"

export interface UnorderedListProps extends BaseIsomerComponent {
  type: "unorderedlist"
  content: (ListItemProps | OrderedListProps | UnorderedListProps)[]
}

export default UnorderedListProps
