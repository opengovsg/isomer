import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const LOGO_CLOUD_TYPE = "logocloud"
export const LogoCloudSchema = Type.Object(
  {
    type: Type.Literal(LOGO_CLOUD_TYPE, { default: LOGO_CLOUD_TYPE }),
    images: Type.Array(
      Type.Object({
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
      }),
      {
        title: "Images for logo cloud",
        minItems: 1,
        maxItems: 10,
      },
    ),
    title: Type.String({
      title: "Title for the logo cloud",
      description: "Upload the images for the logo cloud here or provide a url",
      maxLength: 120,
    }),
  },
  {
    title: "Title",
  },
)

export type LogoCloudProps = Static<typeof LogoCloudSchema> & {
  assetsBaseUrl?: string
}
