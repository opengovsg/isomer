import { z } from "zod"

export const redirectRowSchema = z.object({
  destination: z.string(),
  source: z.string(),
})

export const redirectsFileSchema = z.array(redirectRowSchema)

export interface TestSitemapEntry {
  id: string
  type: string
  title: string
  permalink: string
  lastModified: string
  layout: string
  summary: string
  category?: string
  date?: string
  image?: { src?: string; alt?: string }
  firstImage?: { src?: string; alt?: string }
  ref?: string
  children?: TestSitemapEntry[]
}

export const testSitemapEntrySchema: z.ZodType<TestSitemapEntry> = z.lazy(() =>
  z.looseObject({
    category: z.string().optional(),
    children: z.array(testSitemapEntrySchema).optional(),
    date: z.string().optional(),
    firstImage: z
      .object({
        alt: z.string().optional(),
        src: z.string().optional(),
      })
      .optional(),
    id: z.string(),
    image: z
      .object({
        alt: z.string().optional(),
        src: z.string().optional(),
      })
      .optional(),
    lastModified: z.string(),
    layout: z.string(),
    permalink: z.string(),
    ref: z.string().optional(),
    summary: z.string(),
    title: z.string(),
    type: z.string(),
  }),
)
