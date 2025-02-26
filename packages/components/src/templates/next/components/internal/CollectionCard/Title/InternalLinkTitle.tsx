import { collectionCardLinkStyle } from "./collectionCardLinkStyle"

export const InternalLinkTitle = ({ title }: { title: string }) => {
  return (
    <h3 className={collectionCardLinkStyle()}>
      <span className="line-clamp-3" title={title}>
        {title}
      </span>
    </h3>
  )
}
