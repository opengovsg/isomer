import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { LINK_HREF_PATTERN } from "~/utils/validation"

export const ImageSchema = Type.Object(
  {
    type: Type.Literal("image", { default: "image" }),
    src: Type.String({
      title: "Upload image",
      format: "image",
    }),
    alt: Type.String({
      title: "Alternate text",
      maxLength: 120,
      description:
        "Add a descriptive alternative text for this image. This helps visually impaired users to understand your image.",
    }),
    caption: Type.Optional(
      Type.String({
        title: "Image caption",
        maxLength: 100,
        format: "textarea",
      }),
    ),
    size: Type.Optional(
      Type.Union(
        [
          Type.Literal("default", { title: "Fill page width (recommended)" }),
          Type.Literal("smaller", { title: "Small" }),
        ],
        {
          title: "Image size",
          description:
            "On mobile, images will always fill up to the page width even if you choose “Small”.",
          format: "radio",
          type: "string",
          default: "default",
        },
      ),
    ),
    href: Type.Optional(
      Type.String({
        title: "URL Link",
        description: "The URL to navigate to when the image is clicked",
        format: "link",
        pattern: LINK_HREF_PATTERN,
      }),
    ),
  },
  {
    title: "Image component",
  },
)

export type ImageProps = Static<typeof ImageSchema> & {
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}
