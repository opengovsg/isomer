import type { ImageProps } from "~/interfaces"
import type {
  ArticlePagePageProps,
  FormattedDate,
  IsomerSiteProps,
} from "~/types"

interface FileDetails {
  type: string
  size: string
}
interface BaseCardProps {
  tags?: ArticlePagePageProps["tags"]
  // NOTE: Same as `tags`, but only includes groups with `display: "pills"`
  // (see getTagsFromTagged) — plaintext groups are shown via `plaintextTags`
  pillTags?: ArticlePagePageProps["tags"]
  tagged?: ArticlePagePageProps["tagged"]
  id: string
  date?: Date
  lastModified: string
  // NOTE: Same shape as `tags`, but only includes groups with
  // `display: "plaintext"` — rendered as comma-joined text, dot-separated
  // between groups (see PlaintextTags)
  plaintextTags?: ArticlePagePageProps["tags"]
  title: string
  url: string
  description: string
  image?: Pick<ImageProps, "src" | "alt">
  isContainNeeded?: boolean
  site: IsomerSiteProps
}

interface ArticleCardProps extends BaseCardProps {
  variant: "article"
}

export interface FileCardProps extends BaseCardProps {
  variant: "file"
  fileDetails: FileDetails
}

interface LinkCardProps extends BaseCardProps {
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
  | "plaintextTags"
  | "title"
  | "description"
  | "image"
  | "tags"
  | "pillTags"
  | "tagged"
  | "isContainNeeded"
> & {
  referenceLinkHref: string | undefined
  imageSrc: string | undefined
  itemTitle: string
  formattedDate?: FormattedDate
}

// NOTE: This is to ensure no additional props are being passed to this component
export type ProcessedCollectionCardProps = CollectionCardProps &
  Record<string, never>
