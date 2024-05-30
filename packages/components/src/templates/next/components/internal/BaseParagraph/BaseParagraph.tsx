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
      className={`[&_a]:text-hyperlink hover:[&_a]:text-hyperlink-hover [&:not(:first-child)]:mt-6 sm:[&:not(:first-child)]:mt-7 [&:not(:last-child)]:mb-6 after:[&_a[target*="blank"]]:content-['_↗'] [&_a]:underline visited:[&_a]:text-purple-600 ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      id={id}
    />
  )
}

export default BaseParagraph
