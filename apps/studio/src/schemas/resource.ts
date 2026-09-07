import { z } from "zod"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { SearchResultResource } from "../server/modules/resource/resource.types"
import { generateBigIntSchema } from "./common"
import {
  infiniteOffsetPaginationSchema,
  offsetPaginationSchema,
} from "./pagination"

// A bigint resource id, surfaced as a string by kysely. Shared shape lives in
// common.ts so other modules (e.g. redirects) validate ids identically.
const bigIntSchema = generateBigIntSchema("ID")

export const getMetadataSchema = z.object({
  resourceId: bigIntSchema,
  siteId: z.number(),
})

export const getChildrenSchema = z
  .object({
    includeSearchPage: z.boolean().optional().default(true),
    resourceId: z.union([bigIntSchema, z.null()]),
    siteId: z.string().min(0),
  })
  .extend(infiniteOffsetPaginationSchema.shape)

export const getChildrenOutputSchema = z.object({
  items: z.array(z.custom<ResourceItemContent>()),
  nextOffset: z.number().nullable(),
})

export const getNestedFolderChildrenSchema = z.object({
  resourceId: bigIntSchema,
  siteId: z.string().min(0),
})

export const getNestedFolderChildrenOutputSchema = z.object({
  items: z.array(z.custom<ResourceItemContent>()),
})

export const moveSchema = z.object({
  destinationResourceId: bigIntSchema.nullable(),
  movedResourceId: bigIntSchema,
  shouldCreateRedirect: z.boolean().optional().default(true),
  siteId: z.number(),
})

export const countResourceSchema = z.object({
  resourceId: z.number().optional(),
  siteId: z.number(),
})

export const deleteResourceSchema = z.object({
  resourceId: bigIntSchema,
  siteId: z.number(),
})

export const getParentSchema = z.object({
  resourceId: bigIntSchema,
  siteId: z.number().min(0),
})

export const resourceOrderByOptions = [
  "updated-desc",
  "title-asc",
  "permalink-asc",
] as const

export type ResourceOrderByOption = (typeof resourceOrderByOptions)[number]

export const listResourceSchema = z
  .object({
    orderBy: z.enum(resourceOrderByOptions).optional().default("updated-desc"),
    resourceId: z.number().optional(),
    siteId: z.number(),
  })
  .extend(offsetPaginationSchema.shape)

export const getFullPermalinkSchema = z.object({
  resourceId: bigIntSchema,
  siteId: z.number(),
})

export const getRolesForSchema = z.object({
  resourceId: z.string().nullable(),
  siteId: z.number(),
})

export const getAncestryStackSchema = z.object({
  includeSelf: z.boolean().optional().default(true),
  resourceId: z.string().optional(),
  siteId: z.string(),
})

export const getAncestryStackOutputSchema = z.array(
  z.custom<ResourceItemContent>(),
)

// Limit array size to prevent DoS via expensive recursive queries
export const MAX_BATCH_RESOURCE_IDS = 25

export const getBatchAncestryWithSelfSchema = z.object({
  resourceIds: z.array(z.string()).max(MAX_BATCH_RESOURCE_IDS),
  siteId: z.string(),
})

export const getBatchAncestryWithSelfOutputSchema = z.array(
  z.array(z.custom<ResourceItemContent>()),
)

export interface ResourceItemContent {
  title: string
  permalink: string
  type: ResourceType
  id: string
  parentId: string | null
}

export const searchSchema = z
  .object({
    query: z.string().trim().optional(),
    resourceTypes: z
      .array(z.enum(ResourceType))
      .optional()
      .default(Object.values(ResourceType)),
    siteId: z.string(),
  })
  .extend(infiniteOffsetPaginationSchema.shape)

export const searchOutputSchema = z.object({
  nextOffset: z.number().nullable(),
  recentlyEdited: z.array(z.custom<SearchResultResource>()),
  resources: z.array(z.custom<SearchResultResource>()),
  totalCount: z.number().nullable(),
})

export const searchWithResourceIdsSchema = z.object({
  resourceIds: z.array(bigIntSchema).max(MAX_BATCH_RESOURCE_IDS),
  siteId: z.string(),
})

export const searchWithResourceIdsOutputSchema = z.array(
  z.custom<SearchResultResource>(),
)

export const getIndexPageSchema = z.object({
  parentId: z.string(),
  siteId: z.number(),
})

export const getIndexPageOutputSchema = z.object({
  id: z.string(),
})
