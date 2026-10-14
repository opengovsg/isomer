import { getHeadingTag } from "~/utils/getHeadingTag"

import { collectionCardLinkStyle } from "./collectionCardLinkStyle"

export const InternalLinkTitle = ({
  title,
  headingLevel,
}: {
  title: string
  headingLevel: number
}) => {
  const Tag = getHeadingTag(headingLevel)

  return (
    <Tag className={collectionCardLinkStyle()}>
      <span className="line-clamp-3" title={title}>
        {title}
      </span>
    </Tag>
  )
}
