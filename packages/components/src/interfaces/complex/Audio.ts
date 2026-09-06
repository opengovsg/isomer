import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"
import { AUDIO_EMBED_URL_PATTERN } from "~/utils/validation"

export const AudioSchema = Type.Object(
  {
    title: Type.String({
      description:
        "This is not shown on the page, but is compulsory for accessibility",
      title: "Label for screen readers",
    }),
    type: Type.Literal("audio", { default: "audio" }),
    url: Type.String({
      description:
        "Spotify episode, show, or playlist, or Apple Podcast show/episode embed URL only",
      format: "embed",
      pattern: AUDIO_EMBED_URL_PATTERN,
      title: "Audio to embed",
    }),
  },
  {
    description:
      "The audio component embeds Spotify podcast episodes, shows, and playlists, or Apple Podcast shows and episodes.",
    title: "Audio",
  },
)

export type AudioProps = Static<typeof AudioSchema> & {
  shouldLazyLoad?: boolean
}
