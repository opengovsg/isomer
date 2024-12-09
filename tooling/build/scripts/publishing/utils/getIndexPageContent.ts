const ISOMER_SCHEMA_VERSION = "0.1.0"

// Generate the index page content for a given directory
export const getIndexPageContents = (title: string) => ({
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
