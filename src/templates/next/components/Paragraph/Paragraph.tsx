import { ParagraphProps } from "~/common"
import { getSanitizedInlineContent } from "~/utils/getSanitizedInlineContent"

const Paragraph = ({ content }: ParagraphProps) => {
  const sanitizedContent = getSanitizedInlineContent(content)
  return (
    <p
      className="[&_a]:underline [&_a]:text-blue-500 hover:[&_a]:text-blue-700 visited:[&_a]:text-purple-600 after:[&_a[target=\_blank]]:content-['_↗']"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  )
}

export default Paragraph
