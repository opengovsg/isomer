import type { ImageProps } from "~/interfaces"
import type {
  DateTaggedItem,
  FormattedDate,
  IsomerSiteProps,
  TagGroup,
} from "~/types"
import type { DateFilterStatusId } from "~/types/constants"

// Precomputed for card display.
export interface DateFilterCard {
  id: string
  label: string
  status: DateFilterStatusId
  statusLabel: string
  dateText: string
}

interface FileDetails {
  type: string
  size: string
}
interface BaseCardProps {
  // NOTE: All groups (pills + plaintext combined), used for filter matching
  // (see getFilteredItems/getTagFilters) — derived from `tagged` + `tagCategories`,
  // no legacy fallback.
  tags?: TagGroup[]
  // NOTE: Same as `tags`, but only includes groups shown as pills
  // (see getPillAndPlaintextTags) — plaintext groups are shown via `plaintextTags`
  pillTags?: TagGroup[]
  id: string
  date?: Date
  lastModified: string
  // NOTE: Same shape as `pillTags`, but only includes groups shown as plaintext
  // — rendered as comma-joined text, dot-separated between groups (see PlaintextTags)
  plaintextTags?: TagGroup[]
  dateTagged?: DateTaggedItem[]
  dateFilterCards?: DateFilterCard[]
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
  | "isContainNeeded"
  | "dateTagged"
  | "dateFilterCards"
> & {
  referenceLinkHref: string | undefined
  imageSrc: string | undefined
  itemTitle: string
  formattedDate?: FormattedDate
}

// NOTE: This is to ensure no additional props are being passed to this component
export type ProcessedCollectionCardProps = CollectionCardProps &
  Record<string, never>
