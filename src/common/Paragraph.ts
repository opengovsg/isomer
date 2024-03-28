export interface BaseParagraphProps {
  content: string
  className?: string
}

export interface ParagraphProps extends Omit<BaseParagraphProps, "className"> {
  type: "paragraph"
}

export default ParagraphProps
