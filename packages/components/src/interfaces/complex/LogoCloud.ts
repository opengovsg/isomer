import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps } from "~/types"
import { AltTextSchema, ImageSrcSchema } from "./Image"

export const LOGO_CLOUD_TYPE = "logocloud"
export const LogoCloudSchema = Type.Object(
  {
    type: Type.Literal(LOGO_CLOUD_TYPE, { default: LOGO_CLOUD_TYPE }),
    images: Type.Array(
      Type.Object({
        src: ImageSrcSchema,
        alt: AltTextSchema,
      }),
      {
        title: "Logos",
        description:
          "Upload original logos with transparent backgrounds for best results.",
        minItems: 1,
        maxItems: 10,
      },
    ),
    title: Type.Optional(
      Type.String({
        title: "Title",
      }),
    ),
    variant: Type.Optional(
      Type.Union(
        [
          Type.Literal("default", {
            title: "Default",
          }),
          Type.Literal("greyscale", {
            title: "Greyscale",
          }),
        ],
        {
          default: "default",
          title: "Style",
          format: "radio",
        },
      ),
    ),
  },
  {
    title: "Logocloud",
  },
)

export type LogoCloudProps = Static<typeof LogoCloudSchema> & {
  site: IsomerSiteProps
  shouldLazyLoad?: boolean
}
