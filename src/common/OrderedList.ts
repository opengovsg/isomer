import type { ListItemProps } from "./ListItem"
import type UnorderedListProps from "./UnorderedList"
import type { BaseIsomerComponent } from "./base"

export interface OrderedListProps extends BaseIsomerComponent {
  type: "orderedlist"
  start?: number
  content: (ListItemProps | OrderedListProps | UnorderedListProps)[]
}

export default OrderedListProps
