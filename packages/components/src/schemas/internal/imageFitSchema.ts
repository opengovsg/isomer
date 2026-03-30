import { Type } from "@sinclair/typebox"

import { IMAGE_FIT } from "~/interfaces/constants"
import { ARRAY_RADIO_FORMAT } from "~/interfaces/format"

const generateImageFitSchema = (props: {
  title: string
  description?: string
}) =>
  Type.Union(
    [
      Type.Literal(IMAGE_FIT.Cover, {
        title: "Default (recommended)",
      }),
      Type.Literal(IMAGE_FIT.Content, {
        title: "Resize image to fit",
      }),
    ],
    {
      default: IMAGE_FIT.Cover,
      format: ARRAY_RADIO_FORMAT,
      ...props,
    },
  )

export const ChildrenPagesImageFitSchema = generateImageFitSchema({
  title: "Thumbnail display",
})

export const InfoCardsImageFitSchema = generateImageFitSchema({
  title: "Image display",
  description: `Select "Resize image to fit" only if the image has a white background.`,
})
