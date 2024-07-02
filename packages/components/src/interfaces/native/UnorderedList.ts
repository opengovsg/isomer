import type { ListItemProps } from "./ListItem";
import type { OrderedListProps } from "./OrderedList";

export interface UnorderedListProps {
  type: "unorderedList";
  content: (ListItemProps | OrderedListProps | UnorderedListProps)[];
}
