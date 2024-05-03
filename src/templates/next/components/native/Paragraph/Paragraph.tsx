import type { ParagraphProps } from "~/interfaces"
import { getTextAsHtml } from "~/utils/getTextAsHtml"
import { Paragraph as ParagraphStyle } from "../../../typography/Paragraph"
import { BaseParagraph } from "../../internal"

const Paragraph = ({ content }: Pick<ParagraphProps, "content">) => {
  return (
    <BaseParagraph
      content={getTextAsHtml(content)}
      className={`${ParagraphStyle[1]} text-content`}
    />
  )
}

export default Paragraph
