export interface BaseParagraphProps {
  content: string
  className?: string
  id?: string
}

export interface ParagraphProps extends Omit<BaseParagraphProps, "className"> {
  type: "paragraph"
}
