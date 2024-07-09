import { Type, type Static } from "@sinclair/typebox"

export const ImageSchema = Type.Object(
  {
    type: Type.Literal("image"),
    src: Type.String({
      title: "Image source URL",
      description: "The source URL of the image",
    }),
    alt: Type.String({
      title: "Image alt text",
      description: "The alt text of the image",
    }),
    width: Type.Optional(
      Type.Integer({
        title: "Image width",
        description: "The width of the image",
        exclusiveMinimum: 0,
        maximum: 100,
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

export type ImageProps = Static<typeof ImageSchema>
