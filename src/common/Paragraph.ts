import type { BaseIsomerComponent } from "./base"

export interface BaseParagraphProps extends BaseIsomerComponent {
  content: string
  className?: string
  id?: string
}

export interface ParagraphProps extends Omit<BaseParagraphProps, "className"> {
  type: "paragraph" | "text"
}

export default ParagraphProps
