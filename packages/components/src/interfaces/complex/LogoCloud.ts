import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import { AltTextSchema, ImageSrcSchema } from "./Image"

export const LogoCloudSchema = Type.Object(
  {
    images: Type.Array(
      Type.Object({
        alt: AltTextSchema,
        src: ImageSrcSchema,
      }),
      {
        maxItems: 10,
        minItems: 1,
        title: "Logos",
      },
    ),
    title: Type.String({
      title: "Title",
    }),
    type: Type.Literal("logocloud", { default: "logocloud" }),
  },
  {
    title: "Logo cloud",
  },
)

export type LogoCloudProps = Static<typeof LogoCloudSchema> & {
  site: IsomerSiteProps
  shouldLazyLoad?: boolean
}
