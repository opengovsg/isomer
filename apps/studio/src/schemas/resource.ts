import { z } from "zod"

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

export const getChildrenSchema = z.object({
  resourceId: z.union([bigIntSchema, z.null()]),
})

export const moveSchema = z.object({
  movedResourceId: bigIntSchema,
  destinationResourceId: bigIntSchema,
})

export const listResourceSchema = z.object({
  siteId: z.number(),
  resourceId: z.number().optional(),
})
