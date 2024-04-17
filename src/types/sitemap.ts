import type { CollectionCardProps } from "~/common"
import type { FileCardProps } from "~/common/CollectionCard"

interface IsomerBaseSitemap {
  title: string
  summary: string
  lastModified: string
  permalink: string
  category?: string
  image?: CollectionCardProps["image"]
  date?: CollectionCardProps["lastUpdated"]
  children?: IsomerSitemap[]
}

interface IsomerArticleSitemap extends IsomerBaseSitemap {
  type: "page"
}
interface IsomerFileSitemap extends IsomerBaseSitemap {
  type: "file"
  ref: string
  fileDetails: FileCardProps["fileDetails"]
}
interface IsomerLinkSitemap extends IsomerBaseSitemap {
  type: "link"
  ref: string
}

export type IsomerSitemap =
  | IsomerArticleSitemap
  | IsomerFileSitemap
  | IsomerLinkSitemap
