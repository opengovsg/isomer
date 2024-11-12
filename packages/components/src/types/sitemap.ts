import type { ISOMER_PAGE_LAYOUTS, IsomerPageLayoutType } from "./schema"
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
  layout: Exclude<
    IsomerPageLayoutType,
    typeof ISOMER_PAGE_LAYOUTS.File | typeof ISOMER_PAGE_LAYOUTS.Link
  >
}
interface IsomerFileSitemap extends IsomerBaseSitemap {
  layout: typeof ISOMER_PAGE_LAYOUTS.File
  ref: string
  fileDetails: FileCardProps["fileDetails"]
}
interface IsomerLinkSitemap extends IsomerBaseSitemap {
  layout: typeof ISOMER_PAGE_LAYOUTS.Link
  ref: string
}

export type IsomerSitemap =
  | IsomerPageSitemap
  | IsomerFileSitemap
  | IsomerLinkSitemap
