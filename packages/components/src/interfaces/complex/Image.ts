import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteConfigProps } from "~/types"

export const ImageSchema = Type.Object(
  {
    type: Type.Literal("image", { default: "image" }),
    src: Type.String({
      title: "Upload image",
      format: "image",
    }),
    alt: Type.String({
      title: "Alternate text",
      description:
        "Add a descriptive alternative text for this image. This helps visually impaired users to understand your image.",
    }),
    caption: Type.Optional(
      Type.String({
        title: "Image caption",
      }),
    ),
    width: Type.Optional(
      Type.Integer({
        title: "Image width",
        description: "The width of the image",
        exclusiveMinimum: 0,
        maximum: 100,
        default: 100,
      }),
    ),
    href: Type.Optional(
      Type.String({
        title: "URL Link",
        description: "The URL to navigate to when the image is clicked",
      }),
    ),
  },
  {
    title: "Image component",
  },
)

export type ImageProps = Static<typeof ImageSchema> &
  Pick<IsomerSiteConfigProps, "assetsBaseUrl"> & {
    LinkComponent?: any // Next.js link
  }
