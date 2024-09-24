import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { BaseImageAttributesSchema } from "../complex/Image"

export const TiptapImageSchema = Type.Object(
  {
    type: Type.Literal("image", { default: "image" }),
    attrs: BaseImageAttributesSchema,
  },
  {
    $id: "components-native-image",
    title: "Native image component",
    description:
      "An image element that displays an image with an optional caption",
  },
)

export type TiptapImageProps = Static<typeof TiptapImageSchema> & {
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}
