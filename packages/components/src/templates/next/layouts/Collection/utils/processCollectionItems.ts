import type { Exact } from "type-fest"

import type { AllCardProps, ProcessedCollectionCardProps } from "~/interfaces"
import { getReferenceLinkHref, isExternalUrl } from "~/utils"

export const processCollectionItems = (
  items: AllCardProps[],
): ProcessedCollectionCardProps[] => {
  return items.map((item) => {
    const {
      id,
      site,
      variant,
      lastUpdated,
      category,
      title,
      description,
      image,
      url,
      tags,
    } = item
    const file = variant === "file" ? item.fileDetails : null
    return {
      id,
      lastUpdated,
      category,
      title,
      description,
      image,
      tags,
      referenceLinkHref: getReferenceLinkHref(
        url,
        site.siteMap,
        site.assetsBaseUrl,
      ),
      imageSrc:
        isExternalUrl(item.image?.src) || site.assetsBaseUrl === undefined
          ? item.image?.src
          : `${site.assetsBaseUrl}${item.image?.src}`,
      itemTitle: `${item.title}${file ? ` [${file.type.toUpperCase()}, ${file.size.toUpperCase()}]` : ""}`,
    } as Exact<ProcessedCollectionCardProps, ProcessedCollectionCardProps>
  })
}
