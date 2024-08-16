import { z } from "zod"

export const offsetPaginationSchema = z.object({
  offset: z.number().int().nonnegative().default(0),
  limit: z.number().int().positive().default(10),
})

// Use this schema if you want to expose useInfiniteQuery on trpc procedure.
export const infiniteOffsetPaginationSchema = z.object({
  // the "cursor" key needs to exist to allow for infinite pagination
  // but can actually still act as a regular offset pagination
  cursor: z.number().int().nonnegative().default(0),
  limit: z.number().int().positive().default(10),
})
