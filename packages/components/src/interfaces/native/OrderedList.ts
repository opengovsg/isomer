import type { ListItemProps } from "./ListItem";
import type { UnorderedListProps } from "./UnorderedList";

export interface OrderedListProps {
  type: "orderedList";
  start?: number;
  content: (ListItemProps | OrderedListProps | UnorderedListProps)[];
}
