import type { ImageProps } from "../complex/Image"
import type { DividerProps } from "./Divider"
import type { HardBreakProps } from "./HardBreak"
import type { HeadingProps } from "./Heading"
import type { ListItemProps } from "./ListItem"
import type { OrderedListProps } from "./OrderedList"
import type { ParagraphProps } from "./Paragraph"
import type { TableProps } from "./Table"
import type { UnorderedListProps } from "./UnorderedList"

export type ProseContent = (
  | DividerProps
  | HardBreakProps
  | HeadingProps
  | ImageProps
  | ListItemProps
  | OrderedListProps
  | ParagraphProps
  | TableProps
  | UnorderedListProps
)[]

export interface ProseProps {
  content: ProseContent
  inline?: boolean
}
