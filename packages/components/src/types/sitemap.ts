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
  image?: CollectionCardProps["image"]
  date?: CollectionCardProps["lastUpdated"]
  children?: IsomerSitemap[]
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
