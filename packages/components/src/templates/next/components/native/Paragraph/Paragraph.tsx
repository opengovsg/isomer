import type { ParagraphProps } from "~/interfaces"
import { getTextAsHtml } from "~/utils/getTextAsHtml"
import { BaseParagraph } from "../../internal"

const Paragraph = ({ content, LinkComponent, site, attrs }: ParagraphProps) => {
  return (
    <BaseParagraph
      content={getTextAsHtml({ site, content })}
      className="prose-body-base text-base-content"
      attrs={attrs}
      site={site}
      LinkComponent={LinkComponent}
    />
  )
}

export default Paragraph
