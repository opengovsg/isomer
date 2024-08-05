import type { BaseParagraphProps } from "~/interfaces/native/Paragraph"
import { getSanitizedInlineContent } from "~/utils"

export const BaseParagraph = ({
  content,
  className = "",
  id,
}: BaseParagraphProps) => {
  const sanitizedContent = getSanitizedInlineContent(content)

  return (
    <p
      className={`hover:[&_a]text-link-hover [&:not(:first-child)]:mt-6 [&:not(:last-child)]:mb-6 after:[&_a[target*="blank"]]:content-['_↗'] [&_a]:text-link [&_a]:underline ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      id={id}
    />
  )
}

export default BaseParagraph
