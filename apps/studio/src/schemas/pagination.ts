import { z } from "zod"

export const offsetPaginationSchema = z.object({
  offset: z.number().int().nonnegative().default(0),
  limit: z.number().int().positive().default(10),
})
