export interface BaseParagraphProps {
  content: string
  className?: string
}

export interface ParagraphProps extends BaseParagraphProps {
  type: "paragraph"
}

export default ParagraphProps
