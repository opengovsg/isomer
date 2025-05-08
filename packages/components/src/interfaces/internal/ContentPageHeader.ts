import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { BreadcrumbProps } from "./Breadcrumb"
import type { imageSchemaObject } from "~/schemas/internal"
import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { LINK_HREF_PATTERN } from "~/utils/validation"

export const ContentPageHeaderSchema = Type.Object(
  {
    summary: Type.String({
      title: "Page summary",
      description: "Help users understand what this page is about",
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
    showThumbnail: Type.Boolean({
      title: "Show thumbnail",
      format: "hidden",
      default: false,
    }),
  },
  {
    title: "Content page header",
    description:
      "The content page header is used to display the title, summary, and breadcrumbs of a content page.",
  },
)

export type ContentPageHeaderProps = Static<typeof ContentPageHeaderSchema> &
  Static<typeof imageSchemaObject> & {
    title: string
    lastUpdated: string
    breadcrumb: BreadcrumbProps
    site: IsomerSiteProps
    LinkComponent?: LinkComponentType
    colorScheme?: "default" | "inverse"
  }
