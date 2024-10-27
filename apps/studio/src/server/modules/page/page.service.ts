import type { UnwrapTagged } from "type-fest"
import { ISOMER_PAGE_LAYOUTS } from "@opengovsg/isomer-components"
import { format } from "date-fns"

import type { Layout } from "~/features/editing-experience/components/CreatePageModal/constants"

export const createDefaultPage = ({ layout }: { layout: Layout }) => {
  switch (layout) {
    case ISOMER_PAGE_LAYOUTS.Content: {
      const contentDefaultPage = {
        layout: ISOMER_PAGE_LAYOUTS.Content,
        page: {
          contentPageHeader: {
            summary: "This is the page summary",
          },
        },
        content: [],
        version: "0.1.0",
      } satisfies UnwrapTagged<PrismaJson.BlobJsonContent>
      return contentDefaultPage
    }

    case ISOMER_PAGE_LAYOUTS.Article: {
      const articleDefaultPage = {
        layout: ISOMER_PAGE_LAYOUTS.Article,
        page: {
          date: format(new Date(), "dd-MM-yyyy"),
          category: "Feature Articles",
          articlePageHeader: {
            summary: "This is the page summary",
          },
        },
        content: [],
        version: "0.1.0",
      } satisfies UnwrapTagged<PrismaJson.BlobJsonContent>

      return articleDefaultPage
    }
  }
}
