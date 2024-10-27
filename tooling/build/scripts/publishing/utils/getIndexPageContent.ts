import { ISOMER_PAGE_LAYOUTS } from "@opengovsg/isomer-components"

import type { SitemapEntry } from "../types"

const ISOMER_SCHEMA_VERSION = "0.1.0"

// Generate the index page content for a given directory
export const getIndexPageContents = (
  title: string,
  children: SitemapEntry[],
) => ({
  version: ISOMER_SCHEMA_VERSION,
  layout: ISOMER_PAGE_LAYOUTS.Index,
  page: {
    title,
    contentPageHeader: {
      summary: `Pages in ${title}`,
    },
  },
  content: [
    {
      type: "infocards",
      variant: "cardsWithoutImages",
      cards: children.map((child) => ({
        title: child.title,
        url: child.permalink,
        description: child.summary,
      })),
      maxColumns: 1,
    },
  ],
})
