import { getSanitizedInlineContent } from "~/utils"
import { BaseParagraphProps } from "~/common/Paragraph"

export const BaseParagraph = ({
  content,
  className = "",
  id,
  NodeViewContent = "p",
}: BaseParagraphProps) => {
  const sanitizedContent = getSanitizedInlineContent(content)

  return (
    <NodeViewContent
      as="p"
      className={`[&_a]:underline [&_a]:text-blue-500 hover:[&_a]:text-blue-700 visited:[&_a]:text-purple-600 after:[&_a[target*="blank"]]:content-['_↗'] ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      id={id}
    />
  )
}

export default BaseParagraph
