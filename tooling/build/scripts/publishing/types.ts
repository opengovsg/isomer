import type {
  CollectionPagePageProps as SchemaCollectionPagePageProps,
  IsomerSchema,
} from "@opengovsg/isomer-components"

import type { Resource as DbResource } from "@isomer/db"

import type { PAGE_RESOURCE_TYPES } from "./constants"

// NOTE: The recursive CTE (GET_ALL_RESOURCES_WITH_FULL_PERMALINKS) projects a
// subset of the Resource columns, joins the published Blob's JSONB `content`,
// and synthesises `fullPermalink`. We type that raw row honestly here: `id` and
// `parentId` are strings (Postgres `text`/`uuid`), and `content` is the page's
// `IsomerSchema` (or NULL for folders / unpublished resources). See plan
// decision 6 (mapping seam) and decision 7 (content as IsomerSchema).
export interface ResourceRow extends Pick<
  DbResource,
  "id" | "title" | "permalink" | "type" | "publishedVersionId" | "updatedAt"
> {
  parentId: string | null
  content: IsomerSchema | null
  fullPermalink: string
}

// NOTE: `IsomerSchema["page"]` is a layout-discriminated union and the script
// reads fields opportunistically across variants (e.g. the summary fallback
// chain, collection page props, the `order` of a FolderMeta/CollectionMeta).
// Rather than per-site casts or `any`, we expose a single "page read-model"
// projection: every field the script reads, as optional. This is the union of
// the reachable read fields, surfaced through the adapter (decision 7, option
// 2). Strict per-layout narrowing is deferred to a later PR.
interface PageReadModel {
  layout?: string
  title?: string
  // FolderMeta / CollectionMeta carry these, not real page schemas
  order?: string[]
  variant?: SchemaCollectionPagePageProps["variant"]
  // The page's content block array. `childrenPagesOrdering` is read off the
  // `childrenpages` block (generateSitemapTree); `src`/`alt` are read off the
  // first `image` block (getResourceFirstImage).
  content?: {
    type: string
    childrenPagesOrdering?: string[]
    src?: string
    alt?: string
  }[]
  page?: {
    title?: string
    subtitle?: string
    description?: string
    category?: string
    date?: string
    ref?: string
    image?: {
      src?: string
      alt?: string
    }
    contentPageHeader?: {
      summary?: string | string[]
    }
    articlePageHeader?: {
      summary?: string
    }
    tags?: Tag[]
    tagged?: Tagged[]
    tagCategories?: TagCategory[]
    sortOrder?: string
    defaultSortBy?: string
    defaultSortDirection?: string
    showThumbnail?: boolean
  }
  // Read by getResourceFirstImage
  // (the `content` array entries used to surface the first image component)
}

// The script's working shape. `content` is the page read-model projection so
// the union-spanning reads in index.ts type-check without casts.
export interface Resource extends Omit<ResourceRow, "content"> {
  content?: PageReadModel
}

// THE SEAM (plan decision 6): the single, explicit adapter from an honestly
// typed raw query row to the script's working `Resource`. Runtime behaviour is
// a pass-through — this only reconciles the boundary type (`IsomerSchema`) with
// the script's read-model projection.
export const toResource = (row: ResourceRow): Resource => ({
  ...row,
  content: (row.content ?? undefined) as PageReadModel | undefined,
})

interface Tag {
  selected: string[]
  category: string
}

interface Tagged {
  label: string
  id: string
}

type TagCategory = Tagged & {
  options: Tagged[]
}

interface CollectionPagePageProps {
  defaultSortBy?: string
  defaultSortDirection?: string
  sortOrder?: string
  tagCategories?: TagCategory[]
  showThumbnail?: boolean
  variant?: string
}

export type SitemapEntry = Pick<
  Resource,
  "id" | "title" | "permalink" | "type"
> & {
  lastModified: string
  layout: string
  summary: string
  category?: string
  date?: string
  image?: {
    src?: string
    alt?: string
  }
  firstImage?: {
    src?: string
    alt?: string
  }
  ref?: string
  children?: SitemapEntry[]
  tags?: Tag[]
  tagged?: Tagged[]
  collectionPagePageProps?: CollectionPagePageProps
}

export type PageOnlySitemapEntry = Omit<SitemapEntry, "children"> & {
  type: (typeof PAGE_RESOURCE_TYPES)[number]
}
