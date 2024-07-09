import type { CollectionCardProps } from "~/interfaces"
import type { FileCardProps } from "~/interfaces/internal/CollectionCard"
import { ISOMER_PAGE_LAYOUTS } from "./schema"
import type { ValueOf } from "./utils"

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

interface IsomerPageSitemap extends IsomerBaseSitemap {
  layout: Exclude<ValueOf<typeof ISOMER_PAGE_LAYOUTS>, "file" | "link">
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
