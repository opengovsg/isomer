import type { ParagraphProps } from "~/interfaces"
import { getTextAsHtml } from "~/utils/getTextAsHtml"
import { BaseParagraph } from "../../internal"

const Paragraph = ({ content }: ParagraphProps) => {
  return (
    <BaseParagraph
      content={getTextAsHtml(content)}
      className="prose-body-base text-base-content"
    />
  )
}

export default Paragraph
