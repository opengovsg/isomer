import type ParagraphProps from "./Paragraph"
import type { BaseIsomerComponent } from "./base"

export interface ListItemProps extends BaseIsomerComponent {
  type: "listItem"
  content: [ParagraphProps]
}

export default ListItemProps
