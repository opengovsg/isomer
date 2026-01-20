import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerPageLayoutType, IsomerSiteProps } from "~/types"

export const PageFeedbackSchema = Type.Object(
  {
    apiEndpoint: Type.Optional(
      Type.String({
        title: "API Endpoint",
        description:
          "Optional API endpoint URL. If not provided, will use NEXT_PUBLIC_PAGE_FEEDBACK_API_ENDPOINT environment variable.",
      }),
    ),
  },
  {
    title: "Page Feedback",
    description:
      "A simple feedback tool that asks users 'Is this page helpful?' with Yes/No options.",
  },
)

export type PageFeedbackProps = Static<typeof PageFeedbackSchema> & {
  layout: IsomerPageLayoutType
  apiEndpoint: NonNullable<IsomerSiteProps["pageFeedbackApiEndpoint"]>
  permalink: string
}
