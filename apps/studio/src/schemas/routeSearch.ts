import { z } from "zod"

export const matchStudioRoutesSchema = z.object({
  siteId: z.string().min(1, { message: "Enter a site" }),
  query: z.string().trim().min(1, { message: "Enter a search" }),
})

export const matchedStudioRouteSchema = z.object({
  id: z.string(),
  label: z.string(),
  href: z.string(),
  description: z.string(),
})

export const matchStudioRoutesOutputSchema = z.array(matchedStudioRouteSchema)

export type MatchedStudioRoute = z.infer<typeof matchedStudioRouteSchema>
