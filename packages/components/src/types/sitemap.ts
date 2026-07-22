import type { CollectionCardProps } from "~/interfaces"
import type { FileCardProps } from "~/interfaces/internal/CollectionCard"
import type { ArticlePagePageProps, CollectionPagePageProps } from "~/types"

import type { IsomerPageLayoutType } from "./schema"

interface IsomerBaseSitemap {
  id: string
  title: string
  summary: string
  lastModified: string
  permalink: string
  category?: string
  // TODO: we should aim to separate BaseSiteMap into different types
  // so that the properties that are exclusive to, for example, `CollectionCard`
  // will only be available there
  image?: CollectionCardProps["image"]
  firstImage?: CollectionCardProps["image"]
  date?: string
  children?: IsomerSitemap[]
  // NOTE: the raw selections an editor made; combined with the parent Collection's
  // `tagCategories` (see getPillAndPlaintextTags/getTagsFromTagged) to derive what's
  // actually rendered. The legacy resolved `tags` field is no longer supported.
  tagged?: ArticlePagePageProps["tagged"]
}

interface IsomerPageSitemap extends IsomerBaseSitemap {
  layout: Exclude<IsomerPageLayoutType, "collection" | "file" | "link">
}

export interface IsomerCollectionPageSitemap extends IsomerBaseSitemap {
  layout: Extract<IsomerPageLayoutType, "collection">
  // TODO: Reconsider how this is done as currently every item in the sitemap has the same props
  collectionPagePageProps?: {
    tagCategories?: CollectionPagePageProps["tagCategories"]
    sortOrder?: CollectionPagePageProps["sortOrder"]
    defaultSortBy?: CollectionPagePageProps["defaultSortBy"]
    defaultSortDirection?: CollectionPagePageProps["defaultSortDirection"]
    showThumbnail?: CollectionPagePageProps["showThumbnail"]
  }
}

interface IsomerFileSitemap extends IsomerBaseSitemap {
  layout: "file"
  ref: string
  fileDetails: FileCardProps["fileDetails"]
}
interface IsomerLinkSitemap extends IsomerBaseSitemap {
  layout: "link"
  ref: string
}

export type IsomerSitemap =
  | IsomerPageSitemap
  | IsomerCollectionPageSitemap
  | IsomerFileSitemap
  | IsomerLinkSitemap
