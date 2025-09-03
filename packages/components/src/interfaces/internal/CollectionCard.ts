import type { ImageProps } from "~/interfaces"
import type {
  ArticlePagePageProps,
  IsomerSiteProps,
  LinkComponentType,
} from "~/types"

export interface FileDetails {
  type: string
  size: string
}
interface BaseCardProps {
  tags?: ArticlePagePageProps["tags"]
  tagged?: ArticlePagePageProps["tagged"]
  id: string
  date?: Date
  lastModified: string
  category: string
  title: string
  url: string
  description: string
  image?: Pick<ImageProps, "src" | "alt">
  LinkComponent?: LinkComponentType
  site: IsomerSiteProps
}

// NOTE: exported for storybook compat
export type Tag = NonNullable<BaseCardProps["tags"]>[number]

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
  | "id"
  | "date"
  | "category"
  | "title"
  | "description"
  | "image"
  | "tags"
  | "tagged"
> & {
  referenceLinkHref: string | undefined
  imageSrc: string | undefined
  itemTitle: string
}

// NOTE: This is to ensure no additional props are being passed to this component
export type ProcessedCollectionCardProps = CollectionCardProps &
  Record<string, never>
