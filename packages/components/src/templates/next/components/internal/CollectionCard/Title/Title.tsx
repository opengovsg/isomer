import type { CollectionCardProps } from "~/interfaces"
import { ExternalLinkTitle } from "./ExternalLinkTitle"
import { InternalLinkTitle } from "./InternalLinkTitle"

interface TitleProps {
  title: CollectionCardProps["itemTitle"]
  isExternalLink: boolean
}

export const Title = ({ title, isExternalLink }: TitleProps) => {
  return isExternalLink ? (
    <ExternalLinkTitle title={title} />
  ) : (
    <InternalLinkTitle title={title} />
  )
}
