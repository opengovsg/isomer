import { getSanitizedInlineContent } from "~/utils"
import type { BaseParagraphProps } from "~/interfaces/native/Paragraph"

export const BaseParagraph = ({
  content,
  className = "",
  id,
}: BaseParagraphProps) => {
  const sanitizedContent = getSanitizedInlineContent(content)

  return (
    <p
      className={`[&:not(:first-child)]:mt-6 [&_a]:underline [&_a]:text-blue-500 hover:[&_a]:text-blue-700 visited:[&_a]:text-purple-600 after:[&_a[target*="blank"]]:content-['_↗'] ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      id={id}
    />
  )
}

export default BaseParagraph
