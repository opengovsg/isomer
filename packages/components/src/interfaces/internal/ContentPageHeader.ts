import type { Static } from "@sinclair/typebox"
import type { imageSchemaObject } from "~/schemas/internal"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { LINK_HREF_PATTERN } from "~/utils/validation"

import type { BreadcrumbProps } from "./Breadcrumb"

export const ContentPageHeaderSchema = Type.Object(
  {
    buttonLabel: Type.Optional(
      Type.String({
        description:
          "A descriptive text. Avoid generic text like “Here”, “Click here”, or “Learn more”",
        title: "Button label",
      }),
    ),
    buttonUrl: Type.Optional(
      Type.String({
        description: "When this is clicked, open:",
        format: "link",
        pattern: LINK_HREF_PATTERN,
        title: "Button destination",
      }),
    ),
    showThumbnail: Type.Boolean({
      default: false,
      format: "hidden",
      title: "Show thumbnail",
    }),
    summary: Type.String({
      description: "Help users understand what this page is about",
      format: "textarea",
      maxLength: 500,
      title: "Page summary",
    }),
  },
  {
    description:
      "The content page header is used to display the title, summary, and breadcrumbs of a content page.",
    title: "Content page header",
  },
)

export type ContentPageHeaderProps = Static<typeof ContentPageHeaderSchema> &
  Static<typeof imageSchemaObject> & {
    title: string
    lastUpdated: string
    breadcrumb: BreadcrumbProps
    site: IsomerSiteProps
    colorScheme?: "default" | "inverse"
  }
