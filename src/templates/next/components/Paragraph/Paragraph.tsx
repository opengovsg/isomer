import { ParagraphProps } from "~/common"
import { getSanitizedInlineContent } from "~/utils/getSanitizedInlineContent"

const Paragraph = ({ content }: ParagraphProps) => {
  const sanitizedContent = getSanitizedInlineContent(content)
  return (
    <p
      className="[&_a]:underline [&_a]:underline-offset-2 [&_a]:text-blue-500 hover:[&_a]:text-blue-700"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  )
}

export default Paragraph
