import { Type, type Static } from "@sinclair/typebox"
import type { BreadcrumbProps } from "./Breadcrumb"

export const ContentPageHeaderSchema = Type.Object(
  {
    summary: Type.String({
      title: "Content page summary",
      description: "The summary of the page's content",
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
  LinkComponent?: any
}
