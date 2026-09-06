import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"
import { VIDEO_EMBED_URL_PATTERN } from "~/utils/validation"

export const VideoSchema = Type.Object(
  {
    title: Type.String({
      description:
        "This is not shown on the page, but is compulsory for accessibility",
      title: "Label for screen readers",
    }),
    type: Type.Literal("video", { default: "video" }),
    url: Type.String({
      format: "embed",
      pattern: VIDEO_EMBED_URL_PATTERN,
      title: "Video to embed",
    }),
  },
  {
    description:
      "The video component is used to embed an external video within the current page.",
    title: "Video",
  },
)

export type VideoProps = Static<typeof VideoSchema> & {
  shouldLazyLoad?: boolean
}
