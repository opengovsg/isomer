import type { IsomerPageLayoutType } from "./schema"
import type { CollectionCardProps } from "~/interfaces"
import type { FileCardProps } from "~/interfaces/internal/CollectionCard"

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
  date?: CollectionCardProps["lastUpdated"]
  children?: IsomerSitemap[]
  tags: CollectionCardProps["tags"]
}

interface IsomerPageSitemap extends IsomerBaseSitemap {
  layout: Exclude<IsomerPageLayoutType, "file" | "link">
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
  | IsomerFileSitemap
  | IsomerLinkSitemap
