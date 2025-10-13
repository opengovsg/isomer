import type { ParagraphProps } from "~/interfaces"
import { getTextAsHtml } from "~/utils/getTextAsHtml"
import { BaseParagraph } from "../../internal"

const Paragraph = ({ attrs, content, site, LinkComponent }: ParagraphProps) => {
  return (
    <BaseParagraph
      content={getTextAsHtml({ site, content })}
      className="prose-body-base text-base-content"
      attrs={attrs}
      LinkComponent={LinkComponent}
    />
  )
}

export default Paragraph
