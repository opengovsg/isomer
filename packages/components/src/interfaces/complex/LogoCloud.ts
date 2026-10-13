import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import { IsomerString } from "../primitives/IsomerString"
import { AltTextSchema, ImageSrcSchema } from "./Image"

export const LogoCloudSchema = Type.Object(
  {
    type: Type.Literal("logocloud", { default: "logocloud" }),
    title: IsomerString({
      title: "Title",
    }),
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
