import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps } from "~/types"
import { AltTextSchema, ImageSrcSchema } from "./Image"

export const LOGO_CLOUD_TYPE = "logocloud"

export const LogoCloudVariants = {
  Default: {
    value: "default",
    label: "Colour (Default)",
  },
  Greyscale: {
    value: "greyscale",
    label: "Greyscale",
  },
} as const

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
        description:
          "Upload original logos with transparent backgrounds for best results.",
        minItems: 1,
        maxItems: 10,
      },
    ),
    variant: Type.Optional(
      Type.Union(
        [
          Type.Literal(LogoCloudVariants.Default.value, {
            title: LogoCloudVariants.Default.label,
          }),
          Type.Literal(LogoCloudVariants.Greyscale.value, {
            title: LogoCloudVariants.Greyscale.label,
          }),
        ],
        {
          default: LogoCloudVariants.Default.value,
          title: "Logocloud style",
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
