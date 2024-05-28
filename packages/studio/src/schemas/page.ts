import { z } from "zod";

export const getEditPageSchema = z.object({
  pageId: z.string(),
  siteId: z.string()
})
