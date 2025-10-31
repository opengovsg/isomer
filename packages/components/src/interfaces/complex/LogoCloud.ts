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
        title: "Images for logo cloud",
        minItems: 1,
        maxItems: 10,
      },
    ),
    title: Type.String({
      title: "Title for the logo cloud",
      description: "Upload the images for the logo cloud here or provide a url",
    }),
  },
  {
    title: "Logocloud component",
  },
)

export type LogoCloudProps = Static<typeof LogoCloudSchema> & {
  site: IsomerSiteProps
  shouldLazyLoad?: boolean
}
