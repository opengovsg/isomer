import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"
import { VIDEO_EMBED_URL_PATTERN } from "~/utils/validation"

import { IsomerString } from "../primitives/IsomerString"

export const VideoSchema = Type.Object(
  {
    type: Type.Literal("video", { default: "video" }),
    url: Type.String({
      title: "Video to embed",
      pattern: VIDEO_EMBED_URL_PATTERN,
      format: "embed",
    }),
    title: IsomerString({
      title: "Label for screen readers",
      description:
        "This is not shown on the page, but is compulsory for accessibility",
    }),
  },
  {
    title: "Video",
    description:
      "The video component is used to embed an external video within the current page.",
  },
)

export type VideoProps = Static<typeof VideoSchema> & {
  shouldLazyLoad?: boolean
}
