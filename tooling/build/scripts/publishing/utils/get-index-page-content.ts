import type { CollectionPagePageProps } from "~schema"

const ISOMER_SCHEMA_VERSION = "0.1.0"

// Generate the index page content for a given folder
export const getFolderIndexPageContents = (title: string) => ({
  content: [],
  layout: "index",
  page: {
    contentPageHeader: {
      summary: `Pages in ${title}`,
    },
    title,
  },
  version: ISOMER_SCHEMA_VERSION,
})

export const getCollectionIndexPageContents = (
  title: string,
  variant: CollectionPagePageProps["variant"] = "collection",
) => ({
  content: [],
  layout: "collection",
  page: {
    contentPageHeader: {
      summary: `Pages in ${title}`,
    },
    title,
    variant,
  },
  version: ISOMER_SCHEMA_VERSION,
})
