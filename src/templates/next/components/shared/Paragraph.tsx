import { getSanitizedInlineContent } from "~/utils/getSanitizedInlineContent"
import { BaseParagraphProps } from "~/common/Paragraph"

export const BaseParagraph = ({
  content,
  className = "",
}: BaseParagraphProps) => {
  const sanitizedContent = getSanitizedInlineContent(content)
  return (
    <p
      className={`[&:not(:first-child)]:mt-6 [&_a]:underline [&_a]:text-blue-500 hover:[&_a]:text-blue-700 visited:[&_a]:text-purple-600 after:[&_a[target=\_blank]]:content-['_↗'] ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  )
}

export default BaseParagraph
