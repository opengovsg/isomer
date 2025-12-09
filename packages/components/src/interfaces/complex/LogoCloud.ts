import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps } from "~/types"
import { AltTextSchema, ImageSrcSchema } from "./Image"

export const LOGO_CLOUD_TYPE = "logocloud"

export const LogoCloudSchema = Type.Object(
  {
    title: Type.Optional(
      Type.String({
        title: "Title",
      }),
    ),
    type: Type.Literal(LOGO_CLOUD_TYPE, { default: LOGO_CLOUD_TYPE }),
    images: Type.Array(
      Type.Object({
        src: ImageSrcSchema,
        alt: AltTextSchema,
      }),
      {
        title: "Logos",
        minItems: 1,
        maxItems: 10,
      },
    ),
  },
  {
    title: "Logo cloud",
  },
)

export type LogoCloudProps = Static<typeof LogoCloudSchema> & {
  site: IsomerSiteProps
  shouldLazyLoad?: boolean
}
