import type { CollectionCardProps } from "~/interfaces"

import { ExternalLinkTitle } from "./ExternalLinkTitle"
import { InternalLinkTitle } from "./InternalLinkTitle"

interface TitleProps {
  title: CollectionCardProps["itemTitle"]
  isExternalLink: boolean
  headingLevel: number
}

export const Title = ({ title, isExternalLink, headingLevel }: TitleProps) => {
  return isExternalLink ? (
    <ExternalLinkTitle title={title} headingLevel={headingLevel} />
  ) : (
    <InternalLinkTitle title={title} headingLevel={headingLevel} />
  )
}
