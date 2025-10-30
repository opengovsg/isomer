import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import { VIDEO_EMBED_URL_PATTERN } from "~/utils/validation"

export const VideoSchema = Type.Object(
  {
    type: Type.Literal("video", { default: "video" }),
    url: Type.String({
      title: "Video to embed",
      pattern: VIDEO_EMBED_URL_PATTERN,
      format: "embed",
    }),
    title: Type.String({
      title: "Label for screen readers",
      description:
        "This is not shown on the page, but is compulsory for accessibility",
    }),
  },
  {
    title: "Video component",
    description:
      "The video component is used to embed an external video within the current page.",
  },
)

export type VideoProps = Static<typeof VideoSchema>
