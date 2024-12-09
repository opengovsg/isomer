import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { BreadcrumbProps } from "./Breadcrumb"
import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { LINK_HREF_PATTERN } from "~/utils/validation"

export const ContentPageHeaderSchema = Type.Object(
  {
    summary: Type.String({
      title: "Content page summary",
      description: "The summary of the page's content",
      maxLength: 300,
      format: "textarea",
    }),
    buttonLabel: Type.Optional(
      Type.String({
        title: "Button label",
        description:
          "A descriptive text. Avoid generic text like “Here”, “Click here”, or “Learn more”",
      }),
    ),
    buttonUrl: Type.Optional(
      Type.String({
        title: "Button destination",
        description: "When this is clicked, open:",
        format: "link",
        pattern: LINK_HREF_PATTERN,
      }),
    ),
  },
  {
    title: "Content page header",
    description:
      "The content page header is used to display the title, summary, and breadcrumbs of a content page.",
  },
)

export type ContentPageHeaderProps = Static<typeof ContentPageHeaderSchema> & {
  title: string
  lastUpdated: string
  breadcrumb: BreadcrumbProps
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}
