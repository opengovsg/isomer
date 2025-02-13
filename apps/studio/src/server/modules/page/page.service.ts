import type { UnwrapTagged } from "type-fest"
import { format } from "date-fns"

export const createDefaultPage = ({
  layout,
}: {
  layout: "content" | "article"
}) => {
  switch (layout) {
    case "content": {
      const contentDefaultPage = {
        layout: "content",
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

    case "article": {
      const articleDefaultPage = {
        layout: "article",
        page: {
          date: format(new Date(), "dd/MM/yyyy"),
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
