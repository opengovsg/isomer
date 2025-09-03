import type { IsomerPageLayoutType } from "./schema"
import type { CollectionCardProps } from "~/interfaces"
import type { FileCardProps } from "~/interfaces/internal/CollectionCard"
import type { CollectionPagePageProps } from "~/types"

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
  date?: string
  children?: IsomerSitemap[]
  tags?: CollectionCardProps["tags"]
  tagged?: CollectionCardProps["tagged"]
}

interface IsomerPageSitemap extends IsomerBaseSitemap {
  layout: Exclude<IsomerPageLayoutType, "collection" | "file" | "link">
}

export interface IsomerCollectionPageSitemap extends IsomerBaseSitemap {
  layout: Extract<IsomerPageLayoutType, "collection">
  // TODO: Reconsider how this is done as currently every item in the sitemap has the same props
  collectionPagePageProps?: {
    tagCategories?: CollectionPagePageProps["tagCategories"]
    defaultSortBy?: CollectionPagePageProps["defaultSortBy"]
    defaultSortDirection?: CollectionPagePageProps["defaultSortDirection"]
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
