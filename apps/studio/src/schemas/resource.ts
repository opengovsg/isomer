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
  siteId: z.number(),
  resourceId: bigIntSchema,
})

export const getChildrenSchema = z
  .object({
    resourceId: z.union([bigIntSchema, z.null()]),
    siteId: z.string().min(0),
  })
  .merge(infiniteOffsetPaginationSchema)

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
  siteId: z.number(),
  movedResourceId: bigIntSchema,
  destinationResourceId: bigIntSchema.nullable(),
  // Create a redirect from the resource's old URL on move. Defaults on,
  // matching the checkbox's default-checked state.
  shouldCreateRedirect: z.boolean().optional().default(true),
})

export const countResourceSchema = z.object({
  siteId: z.number(),
  resourceId: z.number().optional(),
})

export const deleteResourceSchema = z.object({
  siteId: z.number(),
  resourceId: bigIntSchema,
})

export const getParentSchema = z.object({
  siteId: z.number().min(0),
  resourceId: bigIntSchema,
})

export const resourceOrderByOptions = ["updated-desc", "title-asc"] as const

export type ResourceOrderByOption = (typeof resourceOrderByOptions)[number]

export const listResourceSchema = z
  .object({
    siteId: z.number(),
    resourceId: z.number().optional(),
    orderBy: z.enum(resourceOrderByOptions).optional().default("updated-desc"),
  })
  .merge(offsetPaginationSchema)

export const getFullPermalinkSchema = z.object({
  siteId: z.number(),
  resourceId: bigIntSchema,
})

export const getRolesForSchema = z.object({
  siteId: z.number(),
  resourceId: z.string().nullable(),
})

export const getAncestryStackSchema = z.object({
  siteId: z.string(),
  resourceId: z.string().optional(),
  includeSelf: z.boolean().optional().default(true),
})

export const getAncestryStackOutputSchema = z.array(
  z.custom<ResourceItemContent>(),
)

// Limit array size to prevent DoS via expensive recursive queries
export const MAX_BATCH_RESOURCE_IDS = 25

export const getBatchAncestryWithSelfSchema = z.object({
  siteId: z.string(),
  resourceIds: z.array(z.string()).max(MAX_BATCH_RESOURCE_IDS),
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
    siteId: z.string(),
    query: z.string().trim().optional(),
    resourceTypes: z
      .array(z.nativeEnum(ResourceType))
      .optional()
      .default(Object.values(ResourceType)),
  })
  .merge(infiniteOffsetPaginationSchema)

export const searchOutputSchema = z.object({
  totalCount: z.number().nullable(),
  resources: z.array(z.custom<SearchResultResource>()),
  recentlyEdited: z.array(z.custom<SearchResultResource>()),
  nextOffset: z.number().nullable(),
})

export const searchWithResourceIdsSchema = z.object({
  siteId: z.string(),
  resourceIds: z.array(bigIntSchema).max(MAX_BATCH_RESOURCE_IDS),
})

export const searchWithResourceIdsOutputSchema = z.array(
  z.custom<SearchResultResource>(),
)

export const getIndexPageSchema = z.object({
  siteId: z.number(),
  parentId: z.string(),
})

export const getIndexPageOutputSchema = z.object({
  id: z.string(),
})
