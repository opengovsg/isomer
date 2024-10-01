import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { BreadcrumbProps } from "./Breadcrumb"
import type { IsomerSiteProps, LinkComponentType } from "~/types"

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
        description: "The label for the button",
      }),
    ),
    buttonUrl: Type.Optional(
      Type.String({
        title: "Button URL",
        description: "The URL the button should link to",
        format: "link",
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
