import type { ImageProps } from "~/interfaces"
import type {
  CollectionPagePageProps,
  IsomerSiteProps,
  LinkComponentType,
} from "~/types"

type Tags = Pick<CollectionPagePageProps, "tags">
type Tagged = Pick<CollectionPagePageProps, "tagged">

export interface FileDetails {
  type: string
  size: string
}
interface BaseCardProps extends Tags, Tagged {
  id: string
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
  variant: "article"
}

export interface FileCardProps extends BaseCardProps {
  variant: "file"
  fileDetails: FileDetails
}

export interface LinkCardProps extends BaseCardProps {
  variant: "link"
}

export type AllCardProps = ArticleCardProps | FileCardProps | LinkCardProps

// NOTE: This is client-side rendering and we want as much pre-processing
// on the server as possible to improve performance + reduce file and bandwidth size
// Thus, only the necessary props are passed to this component.
export type CollectionCardProps = Pick<
  AllCardProps,
  "id" | "lastUpdated" | "category" | "title" | "description" | "image" | "tags"
> & {
  referenceLinkHref: string | undefined
  imageSrc: string | undefined
  itemTitle: string
}

// NOTE: This is to ensure no additional props are being passed to this component
export type ProcessedCollectionCardProps = CollectionCardProps &
  Record<string, never>
