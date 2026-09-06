import type { ParagraphProps } from "~/interfaces"
import { getTextAsHtml } from "~/utils/getTextAsHtml"

import { BaseParagraph } from "../../internal/BaseParagraph"

export const Paragraph = ({ attrs, content, site }: ParagraphProps) => 
  (
    <BaseParagraph
      content={getTextAsHtml({ content, site })}
      className="prose-body-base text-base-content"
      attrs={attrs}
    />
  )

