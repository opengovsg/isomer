import type { TextProps } from "./Text"

export interface BaseParagraphProps {
  content: string
  className?: string
  id?: string
}

export interface ParagraphProps
  extends Omit<BaseParagraphProps, "className" | "content"> {
  type: "paragraph"
  content: TextProps[]
}
