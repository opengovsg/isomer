import type { BaseParagraphProps } from "~/interfaces/native/Paragraph"
import { twMerge } from "~/lib/twMerge"
import { getSanitizedInlineContent } from "~/utils"

export const BaseParagraph = ({
  content,
  className,
  id,
}: BaseParagraphProps) => {
  const sanitizedContent = getSanitizedInlineContent(content)

  return (
    <p
      className={twMerge(
        `hover:[&_a]text-link-hover focus-visible:[&_a]:shadow-focus-visible focus-visible:[&_a]:bg-utility-highlight [&:not(:first-child)]:mt-6 [&:not(:last-child)]:mb-6 after:[&_a[target*="blank"]]:content-['_↗'] [&_a]:text-link [&_a]:underline [&_a]:outline-none focus-visible:[&_a]:text-base-content-strong focus-visible:[&_a]:decoration-transparent focus-visible:[&_a]:transition-none`,
        className,
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      id={id}
    />
  )
}

export default BaseParagraph
