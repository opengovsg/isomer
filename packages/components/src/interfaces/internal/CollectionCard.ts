import type { ImageProps } from "~/interfaces"
import type { LinkComponentType } from "~/types"

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
}

export interface ArticleCardProps extends BaseCardProps {
  variant: "article"
}

export interface FileCardProps extends BaseCardProps {
  variant: "file"
  fileDetails: FileDetails
}

export interface LinkCardProps extends BaseCardProps {
  variant: "link"
}

export type CollectionCardProps =
  | ArticleCardProps
  | FileCardProps
  | LinkCardProps
