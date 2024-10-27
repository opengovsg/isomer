import type { ImageProps } from "~/interfaces"
import type {
  ISOMER_PAGE_LAYOUTS,
  IsomerSiteProps,
  LinkComponentType,
} from "~/types"

export interface Tag {
  title: string
}

export interface FileDetails {
  type: string
  size: string
}
interface BaseCardProps {
  lastUpdated?: string
  category: string
  title: string
  url: string
  description: string
  image?: Pick<ImageProps, "src" | "alt">
  LinkComponent?: LinkComponentType
  site: IsomerSiteProps
}

export interface ArticleCardProps extends BaseCardProps {
  variant: ISOMER_PAGE_LAYOUTS.Article
}

export interface FileCardProps extends BaseCardProps {
  variant: ISOMER_PAGE_LAYOUTS.File
  fileDetails: FileDetails
}

export interface LinkCardProps extends BaseCardProps {
  variant: ISOMER_PAGE_LAYOUTS.Link
}

export type CollectionCardProps =
  | ArticleCardProps
  | FileCardProps
  | LinkCardProps
