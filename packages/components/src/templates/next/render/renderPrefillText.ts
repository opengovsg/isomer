import type { IsomerSchema } from "~/types"
import { z } from "zod"

// Zod parsers for extracting prefill data from different page layouts
// NOTE: This is a temporary construct and the long term fix should be
// to migrate IsomerSchema to use `Type.Intersect` rather than `Type.Composite`
const imageSchema = z.object({
  src: z.string(),
  alt: z.string(),
})

const articlePageHeaderSchema = z.object({
  summary: z.string(),
})

const contentPageHeaderSchema = z.object({
  summary: z.string(),
})

const articlePageSchema = z.object({
  articlePageHeader: articlePageHeaderSchema.optional(),
  image: imageSchema.optional(),
})

const contentPageSchema = z.object({
  contentPageHeader: contentPageHeaderSchema.optional(),
  image: imageSchema.optional(),
})

const databasePageSchema = z.object({
  contentPageHeader: contentPageHeaderSchema.optional(),
})

const collectionPageSchema = z.object({
  subtitle: z.string().optional(),
})

const refPageSchema = z.object({
  description: z.string().optional(),
  image: imageSchema.optional(),
})

interface PrefillContent {
  description?: string
  thumbnail?: string
}
export const renderPrefillText = (content: IsomerSchema): PrefillContent => {
  switch (content.layout) {
    case "article": {
      const page = articlePageSchema.parse(content.page)
      return {
        description: page.articlePageHeader?.summary,
        thumbnail: page.image?.src,
      }
    }
    case "content":
    case "index": {
      const page = contentPageSchema.parse(content.page)
      return {
        description: page.contentPageHeader?.summary,
        thumbnail: page.image?.src,
      }
    }
    case "database": {
      const page = databasePageSchema.parse(content.page)
      return {
        description: page.contentPageHeader?.summary,
      }
    }
    case "collection": {
      const page = collectionPageSchema.parse(content.page)
      return {
        description: page.subtitle,
      }
    }
    case "file":
    case "link": {
      const page = refPageSchema.parse(content.page)
      return {
        description: page.description,
        thumbnail: page.image?.src,
      }
    }
    case "homepage":
    case "search":
    default:
      return {}
  }
}
