import type {
  ArticlePagePageProps,
  CollectionPagePageProps,
  ContentPagePageProps,
  DatabasePagePageProps,
  IsomerSchema,
  LinkRefPageProps,
} from "~/types"

interface PrefillContent {
  description?: string
  thumbnail?: string
  thumbnailAlt?: string
}

// Studio's Tailwind build loads this file through jiti. On Zod 4.6.x, `import { z }`
// from "zod" is undefined there, so use page prop types instead of Zod parsers.
export const renderPrefillText = (content: IsomerSchema): PrefillContent => {
  switch (content.layout) {
    case "article": {
      const page = content.page as ArticlePagePageProps
      return {
        description: page.articlePageHeader?.summary,
        thumbnail: page.image?.src,
        thumbnailAlt: page.image?.alt,
      }
    }
    case "content":
    case "index": {
      const page = content.page as ContentPagePageProps
      return {
        description: page.contentPageHeader?.summary,
        thumbnail: page.image?.src,
        thumbnailAlt: page.image?.alt,
      }
    }
    case "database": {
      const page = content.page as DatabasePagePageProps
      return {
        description: page.contentPageHeader?.summary,
      }
    }
    case "collection": {
      const page = content.page as CollectionPagePageProps
      return {
        description: page.subtitle,
      }
    }
    case "link": {
      const page = content.page as LinkRefPageProps
      return {
        description: page.description,
        thumbnail: page.image?.src,
        thumbnailAlt: page.image?.alt,
      }
    }
    case "homepage":
    case "search":
    default:
      return {}
  }
}
