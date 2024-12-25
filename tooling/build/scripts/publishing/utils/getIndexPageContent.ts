import { CollectionPagePageProps } from "~schema"

const ISOMER_SCHEMA_VERSION = "0.1.0"

// Generate the index page content for a given folder
export const getFolderIndexPageContents = (title: string) => ({
  version: ISOMER_SCHEMA_VERSION,
  layout: "index",
  page: {
    title,
    contentPageHeader: {
      summary: `Pages in ${title}`,
    },
  },
  content: [],
})

export const getCollectionIndexPageContents = (
  title: string,
  variant: CollectionPagePageProps["variant"] = "collection",
) => ({
  version: ISOMER_SCHEMA_VERSION,
  layout: "collection",
  page: {
    title,
    contentPageHeader: {
      summary: `Pages in ${title}`,
    },
    variant,
  },
  content: [],
})
