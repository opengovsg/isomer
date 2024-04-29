import type { DividerProps } from "./Divider"
import type { HeadingProps } from "./Heading"
import type { ImageProps } from "./Image"
import type { ListItemProps } from "./ListItem"
import type { OrderedListProps } from "./OrderedList"
import type { ParagraphProps } from "./Paragraph"
import type { TableProps } from "./Table"
import type { UnorderedListProps } from "./UnorderedList"

export type ProseContent = (
  | DividerProps
  | HeadingProps
  | ImageProps
  | ListItemProps
  | OrderedListProps
  | ParagraphProps
  | TableProps
  | UnorderedListProps
)[]

export interface ProseProps {
  type: "prose"
  content: ProseContent
  inline?: boolean
}
