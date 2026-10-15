import { z } from "zod"

import { infiniteOffsetPaginationSchema } from "./pagination"

// `pageId`/`siteId` match the shape `basePageSchema` (in `~/schemas/page.ts`)
// already uses across the page editor, since this is always called with the
// same route params.
export const listVersionHistorySchema = z
  .object({
    pageId: z.number().min(1),
    siteId: z.number().min(1),
  })
  .merge(infiniteOffsetPaginationSchema)
