import type { ParagraphProps } from "~/interfaces"
import { getTextAsHtml } from "~/utils/getTextAsHtml"
import { BaseParagraph } from "../../internal"

const Paragraph = ({ content }: Pick<ParagraphProps, "content">) => {
  return (
    <BaseParagraph
      content={getTextAsHtml(content)}
      className="text-paragraph-01 text-content"
    />
  )
}

export default Paragraph
