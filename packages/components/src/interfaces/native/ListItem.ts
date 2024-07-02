import type { ParagraphProps } from "./Paragraph";

export interface ListItemProps {
  type: "listItem";
  content: ParagraphProps[];
}
