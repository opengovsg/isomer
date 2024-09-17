import { z } from "zod"

import {
  infiniteOffsetPaginationSchema,
  offsetPaginationSchema,
} from "./pagination"

const resourceSchema = z
  .string()
  .min(1)
  .regex(/[0-9]+/)
  .refine((s) => !s.startsWith("0"))

// NOTE: We want to accept string
// but validate that the string conforms to bigint.
// Oddly enough, kysely doesn't allow `bigint` to query
export const bigIntSchema = z
  // NOTE: A valid `bigint` is one that
  // begins with a non-zero digit
  // and has length > 1
  .string()
  .min(1)
  .regex(/^[0-9]+$/)
  .refine((v) => v.at(0) !== "0")

export const getMetadataSchema = z.object({
  resourceId: bigIntSchema,
})

export const getChildrenSchema = z
  .object({
    resourceId: z.union([bigIntSchema, z.null()]),
    siteId: z.string().min(0),
  })
  .merge(infiniteOffsetPaginationSchema)

export const moveSchema = z.object({
  movedResourceId: bigIntSchema,
  destinationResourceId: bigIntSchema,
})

export const countResourceSchema = z.object({
  siteId: z.number(),
  resourceId: z.number().optional(),
})

export const deleteResourceSchema = z.object({
  siteId: z.number(),
  resourceId: resourceSchema,
})

export const getParentSchema = z.object({
  siteId: z.number().min(0),
  resourceId: resourceSchema,
})

export const listResourceSchema = z
  .object({
    siteId: z.number(),
    resourceId: z.number().optional(),
  })
  .merge(offsetPaginationSchema)

export const getFullPermalinkSchema = z.object({
  resourceId: bigIntSchema,
})

export const getAncestrySchema = z.object({
  siteId: z.string(),
  resourceId: z.string().optional(),
})
