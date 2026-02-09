import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import { AUDIO_EMBED_URL_PATTERN } from "~/utils/validation"

export const AudioSchema = Type.Object(
  {
    type: Type.Literal("audio", { default: "audio" }),
    url: Type.String({
      title: "Audio to embed",
      description:
        "Spotify episode or show, or Apple Podcast show/episode embed URL only",
      pattern: AUDIO_EMBED_URL_PATTERN,
      format: "embed",
    }),
    title: Type.String({
      title: "Label for screen readers",
      description:
        "This is not shown on the page, but is compulsory for accessibility",
    }),
  },
  {
    title: "Audio",
    description:
      "The audio component embeds Spotify podcast episodes and shows, or Apple Podcast shows and episodes.",
  },
)

export type AudioProps = Static<typeof AudioSchema> & {
  shouldLazyLoad?: boolean
}
