import type { Exact } from "type-fest"
import type {
  AllCardProps,
  ProcessedCollectionCardProps,
} from "~/interfaces/internal/CollectionCard"
import { getFormattedDate } from "~/utils/getFormattedDate"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

export const processCollectionItems = (
  items: AllCardProps[],
): ProcessedCollectionCardProps[] => {
  return items.map((item) => {
    const {
      id,
      site,
      variant,
      date,
      plaintextTags,
      title,
      description,
      image,
      isContainNeeded,
      url,
      tags,
      pillTags,
    } = item
    const file = variant === "file" ? item.fileDetails : null
    const processedItem = {
      id,
      date,
      plaintextTags,
      title,
      description,
      image,
      isContainNeeded,
      tags,
      pillTags,
      referenceLinkHref: getReferenceLinkHref(
        url,
        site.siteMapArray,
        site.assetsBaseUrl,
      ),
      imageSrc: item.image?.src,
      itemTitle: `${item.title}${file ? ` [${file.type.toUpperCase()}, ${file.size.toUpperCase()}]` : ""}`,
      formattedDate: date ? getFormattedDate(date.toISOString()) : undefined,
    }
    // SAFETY: Exact<> enforces no extra props; cast is required for Record<string, never> intersection
    return processedItem as Exact<
      ProcessedCollectionCardProps,
      ProcessedCollectionCardProps
    >
  })
}
